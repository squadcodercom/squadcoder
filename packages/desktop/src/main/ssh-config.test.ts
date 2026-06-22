import { describe, expect, test } from "bun:test"
import { parseSshConfigText } from "./ssh-config"

describe("parseSshConfigText", () => {
  test("parses Host blocks with HostName/User/Port/IdentityFile", () => {
    const hosts = parseSshConfigText(
      [
        "Host Relay",
        "  HostName 15.235.10.99",
        "  User ubuntu",
        "  Port 2222",
        "  IdentityFile ~/.ssh/rspamd_np",
        "",
        "Host prod",
        "  HostName prod.example.com",
        "  User deploy",
      ].join("\n"),
    )
    expect(hosts).toHaveLength(2)
    expect(hosts[0]).toEqual({
      host: "Relay",
      hostName: "15.235.10.99",
      user: "ubuntu",
      port: 2222,
      identityFile: expect.stringContaining("rspamd_np"),
    })
    expect(hosts[1].host).toBe("prod")
    expect(hosts[1].port).toBeUndefined()
  })

  test("skips wildcard Host blocks and comments", () => {
    const hosts = parseSshConfigText(
      ["# global defaults", "Host *", "  ForwardAgent yes", "", "Host only", "  HostName 10.0.0.1"].join("\n"),
    )
    expect(hosts.map((h) => h.host)).toEqual(["only"])
  })

  test("accepts Key=value form and the first concrete alias", () => {
    const hosts = parseSshConfigText(["Host gw *.internal", "  HostName=10.1.1.1", "  User=root"].join("\n"))
    expect(hosts).toHaveLength(1)
    expect(hosts[0]).toMatchObject({ host: "gw", hostName: "10.1.1.1", user: "root" })
  })

  test("empty / missing config → no hosts", () => {
    expect(parseSshConfigText("")).toEqual([])
  })
})
