import { createSimpleContext } from "@squadcoder/ui/context"
import type { AsyncStorage, SyncStorage } from "@solid-primitives/storage"
import type { Accessor } from "solid-js"
import { ServerConnection } from "./server"

type PickerPaths = string | string[] | null
type OpenDirectoryPickerOptions = { title?: string; multiple?: boolean }
type OpenFilePickerOptions = { title?: string; multiple?: boolean; accept?: string[]; extensions?: string[] }
type SaveFilePickerOptions = { title?: string; defaultPath?: string }
type UpdateInfo = { updateAvailable: boolean; version?: string }

// SQUADCODER: Remote-SSH (desktop only). The Electron main process owns the ssh tunnel + remote-engine
// bootstrap; these optional Platform methods are the renderer's bridge to it. Undefined on web.
export type SshConnectOptions = {
  host: string
  user: string
  /** SSH port, default 22 */
  port?: number
  /** Explicit private-key file. Omit to use ssh-agent / default identities. */
  keyFile?: string
  /** Remote engine port (default 4096). */
  remotePort?: number
}
export type SshConnectResult = { host: string; url: string; username: string; password: string }
export type SshDetect = { available: boolean; version?: string }
/** One host parsed from the user's ~/.ssh/config, offered for one-click import. */
export type SshConfigEntry = { host: string; hostName?: string; user?: string; port?: number; identityFile?: string }
/** Persisted SSH server params (no secrets) so a saved host can reconnect across app restarts. */
export type SshSavedServer = {
  host: string
  user: string
  port?: number
  keyFile?: string
  remotePort?: number
  displayName?: string
}
export type SshStatus = { host: string; phase: string; message?: string }
/** Error thrown by openSshTunnel; `code` is a stable key for localized messages. */
export type SshConnectError = Error & { code?: string }

export type Platform = {
  /** Platform discriminator */
  platform: "web" | "desktop"

  /** Desktop OS (Tauri only) */
  os?: "macos" | "windows" | "linux"

  /** App version */
  version?: string

  /** Open a URL in the default browser */
  openLink(url: string): void

  /** Open a local path in a local app (desktop only) */
  openPath?(path: string, app?: string): Promise<void>

  /** Restart the app  */
  restart(): Promise<void>

  /** Navigate back in history */
  back(): void

  /** Navigate forward in history */
  forward(): void

  /** Send a system notification (optional deep link) */
  notify(title: string, description?: string, href?: string): Promise<void>

  /** Open directory picker dialog (native on Tauri, server-backed on web) */
  openDirectoryPickerDialog?(opts?: OpenDirectoryPickerOptions): Promise<PickerPaths>

  /** Open native file picker dialog (Tauri only) */
  openFilePickerDialog?(opts?: OpenFilePickerOptions): Promise<PickerPaths>

  /** Save file picker dialog (Tauri only) */
  saveFilePickerDialog?(opts?: SaveFilePickerOptions): Promise<string | null>

  /** Storage mechanism, defaults to localStorage */
  storage?: (name?: string) => SyncStorage | AsyncStorage

  /** Check for updates (Tauri only) */
  checkUpdate?(): Promise<UpdateInfo>

  /** Install updates (Tauri only) */
  update?(): Promise<void>

  /** Fetch override */
  fetch?: typeof fetch

  /** Get the configured default server URL (platform-specific) */
  getDefaultServer?(): Promise<ServerConnection.Key | null>

  /** Set the default server URL to use on app startup (platform-specific) */
  setDefaultServer?(url: ServerConnection.Key | null): Promise<void> | void

  /** Get the configured WSL integration (desktop only) */
  getWslEnabled?(): Promise<boolean>

  /** Set the configured WSL integration (desktop only) */
  setWslEnabled?(config: boolean): Promise<void> | void

  /** Get the preferred display backend (desktop only) */
  getDisplayBackend?(): Promise<DisplayBackend | null> | DisplayBackend | null

  /** Set the preferred display backend (desktop only) */
  setDisplayBackend?(backend: DisplayBackend): Promise<void>

  /** Parse markdown to HTML using native parser (desktop only, returns unprocessed code blocks) */
  parseMarkdown?(markdown: string): Promise<string>

  /** Webview zoom level (desktop only) */
  webviewZoom?: Accessor<number>

  /** Check if an editor app exists (desktop only) */
  checkAppExists?(appName: string): Promise<boolean>

  /** Read image from clipboard (desktop only) */
  readClipboardImage?(): Promise<File | null>

  /** Detect a usable SSH client (desktop only) */
  detectSsh?(): Promise<SshDetect>

  /** Parse ~/.ssh/config to offer the user's configured hosts for one-click import (desktop only) */
  readSshConfig?(): Promise<SshConfigEntry[]>

  /**
   * Open an SSH tunnel to a remote host, bootstrap the remote engine, and resolve the tunneled
   * loopback connection. Rejects with an {@link SshConnectError} carrying a stable `code`.
   * Desktop only.
   */
  openSshTunnel?(opts: SshConnectOptions): Promise<SshConnectResult>

  /** Tear down a remote SSH tunnel (and best-effort stop the remote engine). Desktop only. */
  closeSshTunnel?(host: string): Promise<void>

  /** Subscribe to live tunnel status events. Returns an unsubscribe fn. Desktop only. */
  onSshTunnelStatus?(cb: (status: SshStatus) => void): () => void

  /** Remember a saved SSH server so it reconnects on next launch (no secrets stored). Desktop only. */
  persistSshServer?(config: SshSavedServer): Promise<void>

  /** Forget a saved SSH server + drop any live reconnected entry. Desktop only. */
  forgetSshServer?(host: string): Promise<void>

  /** Custom window controls (desktop only; the renderer draws min/max/close, RTL-aware on Windows). */
  windowMinimize?(): void
  windowToggleMaximize?(): void
  windowClose?(): void
  windowIsMaximized?(): Promise<boolean>
  /** Subscribe to maximize-state changes so the maximize button can toggle its glyph. */
  onWindowMaximizeChange?(cb: (max: boolean) => void): () => void
}

export type DisplayBackend = "auto" | "wayland"

export const { use: usePlatform, provider: PlatformProvider } = createSimpleContext({
  name: "Platform",
  init: (props: { value: Platform }) => {
    return props.value
  },
})
