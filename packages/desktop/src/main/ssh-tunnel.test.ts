import { describe, expect, test } from "bun:test"
import {
  buildBaseSshArgs,
  buildExecArgs,
  buildScpArgs,
  buildTunnelArgs,
  bootstrapScript,
  classifyStderr,
  installAndStartScript,
  parseBootstrapOutput,
  remoteBundlePath,
  safeVersion,
} from "./ssh-tunnel-args"
import type { SshTunnelOptions } from "../preload/types"

const KH = "C:\\Users\\me\\AppData\\Roaming\\app\\ssh\\known_hosts"
const agent: SshTunnelOptions = { host: "example.com", user: "ubuntu", auth: { kind: "agent" } }
const key: SshTunnelOptions = {
  host: "10.0.0.5",
  user: "deploy",
  port: 2222,
  auth: { kind: "key", keyFile: "/home/me/.ssh/id_ed25519" },
}

describe("buildBaseSshArgs", () => {
  test("hardens the connection by default (agent auth)", () => {
    const args = buildBaseSshArgs(agent, KH)
    expect(args).toContain("ExitOnForwardFailure=yes")
    expect(args).toContain("StrictHostKeyChecking=accept-new")
    expect(args).toContain("BatchMode=yes")
    expect(args).toContain(`UserKnownHostsFile=${KH}`)
    // never weaken host-key checking
    expect(args.join(" ")).not.toContain("StrictHostKeyChecking=no")
    // no key flags for agent auth
    expect(args).not.toContain("-i")
    // default port → no -p
    expect(args).not.toContain("-p")
  })

  test("key auth adds -i + IdentitiesOnly and a custom port", () => {
    const args = buildBaseSshArgs(key, KH)
    expect(args).toContain("IdentitiesOnly=yes")
    const i = args.indexOf("-i")
    expect(i).toBeGreaterThanOrEqual(0)
    expect(args[i + 1]).toBe("/home/me/.ssh/id_ed25519")
    const p = args.indexOf("-p")
    expect(p).toBeGreaterThanOrEqual(0)
    expect(args[p + 1]).toBe("2222")
  })
})

describe("buildTunnelArgs", () => {
  test("binds local + remote forwards to loopback and never leaks the password", () => {
    const args = buildTunnelArgs(agent, 54321, 4096, KH)
    expect(args[0]).toBe("-N")
    expect(args).toContain("-L")
    const l = args.indexOf("-L")
    expect(args[l + 1]).toBe("127.0.0.1:54321:127.0.0.1:4096")
    expect(args[args.length - 1]).toBe("ubuntu@example.com")
    // a forward bound to all interfaces would be a security bug
    expect(args.join(" ")).not.toMatch(/-L\s+\d+:/)
    expect(args.join(" ")).not.toContain("0.0.0.0")
  })
})

describe("buildExecArgs", () => {
  test("runs the script via sh -lc against user@host, password not in argv", () => {
    const args = buildExecArgs(agent, "read SC_PW; echo ok", KH)
    expect(args).toContain("ubuntu@example.com")
    expect(args).toContain("sh")
    expect(args).toContain("-lc")
    expect(args[args.length - 1]).toBe("read SC_PW; echo ok")
  })
})

const VER = "b6229ea26d1e"

describe("safeVersion", () => {
  test("accepts a hex hash, rejects anything else (shell-injection guard)", () => {
    expect(safeVersion(VER)).toBe(VER)
    expect(() => safeVersion("../../etc")).toThrow()
    expect(() => safeVersion("v1; rm -rf ~")).toThrow()
    expect(() => safeVersion("")).toThrow()
  })
})

describe("bootstrapScript", () => {
  test("version-aware: reads password from stdin, runs the BUNDLED launcher, no baked secret", () => {
    const s = bootstrapScript(4096, VER)
    expect(s).toContain("read SC_PW")
    expect(s).toContain("MIMOCODE_SERVER_USERNAME=squadcoder")
    expect(s).toContain('MIMOCODE_SERVER_PASSWORD="$SC_PW"')
    // boots its own Node + the launcher (node:sqlite needs the flag on Node 22)
    expect(s).toContain("--experimental-sqlite")
    expect(s).toContain("launcher.mjs")
    // version-pinned server root + the not-installed signal
    expect(s).toContain(`.squadcoder-server/${VER}`)
    expect(s).toContain(`NEEDUPLOAD ${VER}`)
    // password is a runtime stdin var, never baked in
    expect(s).not.toMatch(/MIMOCODE_SERVER_PASSWORD=[A-Za-z0-9]/)
    // launch inherits owner-only umask → token files hardened at-rest
    expect(s).toContain("umask 077")
  })
})

describe("installAndStartScript", () => {
  test("extracts the uploaded bundle into the version dir then starts it", () => {
    const s = installAndStartScript(4096, VER)
    expect(s).toContain(`.squadcoder-server/${VER}.tgz`)
    expect(s).toContain("tar -xzf")
    expect(s).toContain("launcher.mjs")
    expect(s).toContain("--experimental-sqlite")
    // launch inherits owner-only umask → token files hardened at-rest
    expect(s).toContain("umask 077")
  })
})

describe("remoteBundlePath", () => {
  test("home-relative versioned tarball path", () => {
    expect(remoteBundlePath(VER)).toBe(`.squadcoder-server/${VER}.tgz`)
  })
})

describe("buildScpArgs", () => {
  test("hardened transfer, uppercase -P for a custom port, dest is home-relative", () => {
    const args = buildScpArgs(key, "C:/bundle.tgz", ".squadcoder-server/x.tgz", KH)
    expect(args).toContain("StrictHostKeyChecking=accept-new")
    expect(args).toContain("BatchMode=yes")
    expect(args).toContain("-P") // scp uses uppercase -P
    expect(args[args.indexOf("-P") + 1]).toBe("2222")
    expect(args).toContain("-i")
    expect(args[args.length - 2]).toBe("C:/bundle.tgz")
    expect(args[args.length - 1]).toBe("deploy@10.0.0.5:.squadcoder-server/x.tgz")
  })
})

describe("parseBootstrapOutput", () => {
  test("STARTED with port + pid", () => {
    expect(parseBootstrapOutput("STARTED 4096 12345\n")).toEqual({ kind: "started", port: 4096, pid: "12345" })
  })
  test("REUSE", () => {
    expect(parseBootstrapOutput("REUSE 4096")).toEqual({ kind: "reuse", port: 4096 })
  })
  test("NEEDUPLOAD carries the version", () => {
    expect(parseBootstrapOutput(`NEEDUPLOAD ${VER}`)).toEqual({ kind: "need-upload", version: VER })
  })
  test("NOTINSTALLED", () => {
    expect(parseBootstrapOutput("NOTINSTALLED")).toEqual({ kind: "not-installed" })
  })
  test("FAILED carries the log tail", () => {
    const out = parseBootstrapOutput("FAILED 4096\nsome error from the log")
    expect(out.kind).toBe("failed")
  })
})

describe("classifyStderr", () => {
  test.each([
    ["Permission denied (publickey).", "auth-failed"],
    ["Host key verification failed.", "host-key-changed"],
    ["@ WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED! @", "host-key-changed"],
    ["channel 1: open failed: administratively prohibited", "forward-failed"],
    ["ssh: connect to host example.com port 22: Connection timed out", "timed-out"],
    ["ssh: connect to host x port 22: Connection refused", "timed-out"],
    ["something totally unexpected", "unknown"],
  ])("%s → %s", (input, expected) => {
    expect(classifyStderr(input)).toBe(expected)
  })
})
