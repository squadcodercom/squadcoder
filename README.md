<div align="center">

<pre>
  ____                       _  ____          _
 / ___|  __ _ _   _  __ _  __| |/ ___|___   __| | ___ _ __
 \___ \ / _` | | | |/ _` |/ _` | |   / _ \ / _` |/ _ \ '__|
  ___) | (_| | |_| | (_| | (_| | |__| (_) | (_| |  __/ |
 |____/ \__, |\__,_|\__,_|\__,_|\____\___/ \__,_|\___|_|
           |_|
</pre>

# SquadCoder

### Your AI software team — right inside your editor.

SquadCoder is an open-source AI coding assistant that doesn't just autocomplete code — it orchestrates an entire **AI software team** (architect, developers, QA, security, and more) that plan, build, review, and ship features **in parallel**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![Built with Bun](https://img.shields.io/badge/built%20with-Bun%20%2B%20TypeScript-black)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

<img src="assets/squadcoder.png" alt="SquadCoder" width="820">

</div>

---

## ✨ Why SquadCoder

Most AI coding tools give you a single assistant. **SquadCoder gives you a whole team** — a coordinated squad of specialist agents that delegate, build, and verify each other's work the way a real engineering org does. It runs as a polished **desktop app** and a scriptable **CLI**, is **local-first**, and is **MIT-licensed** and fully open.

## 🚀 Features

- **🧑‍🤝‍🧑 Team Mode** — an orchestrator fans out specialist agents (Architect, Developers, QA, Security, UI/UX, and more) that work in parallel, then reconcile into one verified result — with a built-in quality gate that loops fixes until everything is green.
- **🧠 Persistent memory** — project rules, architecture decisions, and hard-won fixes survive across sessions, so SquadCoder gets smarter about *your* codebase over time.
- **🔎 Semantic codebase index** — find code by meaning, not just text. Runs fully offline with a bundled model — no cloud, no API cost.
- **🧩 Skills** — reusable, composable capability packs (design systems, document generation, code review, and more) that agents load on demand.
- **🔌 MCP-native** — first-class Model Context Protocol support: GitHub, Playwright, web search, docs, and any MCP server you add.
- **⏰ Routines & scheduling** — save reusable multi-step tasks and run them on demand or on a schedule.
- **📊 Live usage tracking** — see your model usage at a glance, right above the prompt.
- **🌍 25+ languages, full RTL** — complete internationalization with first-class right-to-left support (Hebrew, Arabic).
- **🖥️ Desktop + CLI** — a beautiful cross-platform desktop app and a scriptable command line.
- **🔒 Local-first & private** — your code and context stay on your machine.

## 📦 Install

### Desktop
Download the latest installer from the [**Releases**](https://github.com/squadcodercom/squadcoder/releases) page and run it.
- **Windows:** `SquadCoder-desktop-win-x64-installer.exe`

### From source
```bash
git clone https://github.com/squadcodercom/squadcoder.git
cd squadcoder
bun install
```

## ⚡ Quick start

1. Launch SquadCoder (desktop app or CLI).
2. Connect a model provider (bring your own key, or sign in).
3. Open a project folder and start chatting — ask for a feature, a fix, or a refactor.
4. Switch to **Team Mode** for anything multi-step: SquadCoder will plan it, split the work across agents, build it, and review it before handing it back.

## 🧑‍🤝‍🧑 How Team Mode works

A single **orchestrator** reads your request, classifies it, and spawns only the specialists the work actually needs — running independent units **in parallel** and looping every fix through a CTO-style **quality gate** (security + QA + end-to-end verification) until it's green. You get **one coherent result**, not a pile of raw agent output.

## ⚙️ Configuration

SquadCoder is configured via `squadcoder.json` — MCP servers, skills, permissions, and model groups. Secrets in config use `{env:VAR}` or `${VAR}` placeholders that resolve from your environment, so **you never hard-code tokens**.

## 🤝 Contributing

Contributions are welcome! Open an issue to discuss a change, or send a pull request. Please run the project's type checks and tests before submitting.

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.

<div align="center">
<sub>Built with ❤️ by the SquadCoder community.</sub>
</div>
