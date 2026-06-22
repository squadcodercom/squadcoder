export type InitStep = { phase: "server_waiting" } | { phase: "sqlite_waiting" } | { phase: "done" }

export type ServerReadyData = {
  url: string
  username: string | null
  password: string | null
}

export type SqliteMigrationProgress = { type: "InProgress"; value: number } | { type: "Done" }

export type WslConfig = { enabled: boolean }

export type LinuxDisplayBackend = "wayland" | "auto"
export type TitlebarTheme = {
  mode: "light" | "dark"
}

export type WindowConfig = {
  updaterEnabled: boolean
}

// SQUADCODER: Remote-SSH wire contract (renderer ⇄ main). The Electron main process owns the
// `ssh -N -L` tunnel + remote-engine bootstrap; the renderer drives it over IPC and attaches to the
// tunneled loopback URL via the existing ServerConnection.Ssh path. See main/ssh-tunnel.ts.
export type SshAuth = { kind: "agent" } | { kind: "key"; keyFile: string }

export type SshTunnelOptions = {
  host: string
  user: string
  /** SSH port, default 22 */
  port?: number
  auth: SshAuth
  /** Remote engine port (default 4096). The tunnel forwards a local loopback port to this. */
  remotePort?: number
}

export type SshTunnelResult = {
  host: string
  /** Tunneled loopback URL the app attaches to, e.g. http://127.0.0.1:54321 */
  url: string
  username: string
  password: string
  remotePort: number
}

export type SshDetectResult = { available: boolean; version?: string }

/** One importable host parsed from ~/.ssh/config. */
export type SshConfigHost = {
  host: string
  hostName?: string
  user?: string
  port?: number
  identityFile?: string
}

export type SshTunnelPhase =
  | "connecting"
  | "bootstrapping"
  | "installing"
  | "opening-tunnel"
  | "attached"
  | "reconnecting"
  | "disconnected"
  | "error"

export type SshTunnelStatus = { host: string; phase: SshTunnelPhase; message?: string }

/** Stable error codes surfaced to the UI for localized messages. */
export type SshErrorCode =
  | "client-missing"
  | "auth-failed"
  | "host-key-changed"
  | "forward-failed"
  | "engine-not-installed"
  | "engine-failed"
  | "timed-out"
  | "unknown"

// Electron's ipcMain.handle drops custom Error props across the boundary, so the tunnel result is a
// discriminated union rather than a thrown SshError — the renderer maps `code` to a localized message.
export type SshTunnelOutcome =
  | { ok: true; result: SshTunnelResult }
  | { ok: false; code: SshErrorCode; message: string }

export type ElectronAPI = {
  killSidecar: () => Promise<void>
  installCli: () => Promise<string>
  awaitInitialization: (onStep: (step: InitStep) => void) => Promise<ServerReadyData>
  getWindowConfig: () => Promise<WindowConfig>
  consumeInitialDeepLinks: () => Promise<string[]>
  getDefaultServerUrl: () => Promise<string | null>
  setDefaultServerUrl: (url: string | null) => Promise<void>
  getWslConfig: () => Promise<WslConfig>
  setWslConfig: (config: WslConfig) => Promise<void>
  getDisplayBackend: () => Promise<LinuxDisplayBackend | null>
  setDisplayBackend: (backend: LinuxDisplayBackend | null) => Promise<void>
  parseMarkdownCommand: (markdown: string) => Promise<string>
  checkAppExists: (appName: string) => Promise<boolean>
  wslPath: (path: string, mode: "windows" | "linux" | null) => Promise<string>
  resolveAppPath: (appName: string) => Promise<string | null>
  storeGet: (name: string, key: string) => Promise<string | null>
  storeSet: (name: string, key: string, value: string) => Promise<void>
  storeDelete: (name: string, key: string) => Promise<void>
  storeClear: (name: string) => Promise<void>
  storeKeys: (name: string) => Promise<string[]>
  storeLength: (name: string) => Promise<number>

  getWindowCount: () => Promise<number>
  onSqliteMigrationProgress: (cb: (progress: SqliteMigrationProgress) => void) => () => void
  onMenuCommand: (cb: (id: string) => void) => () => void
  onDeepLink: (cb: (urls: string[]) => void) => () => void

  // SQUADCODER: Remote-SSH (desktop only)
  detectSsh: () => Promise<SshDetectResult>
  startSshTunnel: (opts: SshTunnelOptions) => Promise<SshTunnelOutcome>
  stopSshTunnel: (host: string) => Promise<void>
  onSshTunnelStatus: (cb: (status: SshTunnelStatus) => void) => () => void
  /** Parse ~/.ssh/config so the user can import an existing host instead of retyping it. */
  readSshConfig: () => Promise<SshConfigHost[]>

  openDirectoryPicker: (opts?: {
    multiple?: boolean
    title?: string
    defaultPath?: string
  }) => Promise<string | string[] | null>
  openFilePicker: (opts?: {
    multiple?: boolean
    title?: string
    defaultPath?: string
    accept?: string[]
    extensions?: string[]
  }) => Promise<string | string[] | null>
  saveFilePicker: (opts?: { title?: string; defaultPath?: string }) => Promise<string | null>
  openLink: (url: string) => void
  openPath: (path: string, app?: string) => Promise<void>
  readClipboardImage: () => Promise<{ buffer: ArrayBuffer; width: number; height: number } | null>
  showNotification: (title: string, body?: string) => void
  getWindowFocused: () => Promise<boolean>
  setWindowFocus: () => Promise<void>
  showWindow: () => Promise<void>
  relaunch: () => void
  getZoomFactor: () => Promise<number>
  setZoomFactor: (factor: number) => Promise<void>
  setTitlebar: (theme: TitlebarTheme) => Promise<void>
  loadingWindowComplete: () => void
  runUpdater: (alertOnFail: boolean) => Promise<void>
  checkUpdate: () => Promise<{ updateAvailable: boolean; version?: string }>
  installUpdate: () => Promise<void>
  setBackgroundColor: (color: string) => Promise<void>

  // SQUADCODER: custom Windows window controls (frameless, RTL-aware).
  windowMinimize: () => void
  windowToggleMaximize: () => void
  windowClose: () => void
  windowIsMaximized: () => Promise<boolean>
  onWindowMaximizeChange: (cb: (max: boolean) => void) => () => void
}
