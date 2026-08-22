# GitNexus Local Setup & Automation

This directory contains everything needed to run GitNexus indexing and wiki generation **100% locally** on this machine, without requiring an internet connection or LLM API keys.

It is divided into two parts:
1. **For Humans:** A batch script to automate the process.
2. **For AI Agents:** Skill files that teach the AI how to do this.

---

## Prerequisites (One-time setup)

Before using these tools, ensure GitNexus is installed globally on your machine:

Open Command Prompt (CMD) and run:
```cmd
npm install -g gitnexus@latest
```

Verify it works:
```cmd
gitnexus --version
```

---

## 👨‍💻 For Humans: How to Run Manually

We've provided a batch script that automates the entire process: analyzing the repo, building the graph database (`lbug`), and generating the markdown wiki (`wiki.md`).

### Option 1: Double-click (Interactive)

1. Navigate to `Skills\GitNexus\scripts\` in Windows Explorer.
2. Double-click `gitnexus-index.bat`.
3. A command window will open and ask you for:
   - The absolute path to the target Git repository you want to index.
   - Where you want to save the output (press Enter to use the default: `<target-repo>/.gitnexus/`).

### Option 2: Command Line

Open Command Prompt and pass the target repository path directly:

```cmd
C:\Projects\Mavon\Clients\reposit-solar\discovery\Skills\GitNexus\scripts\gitnexus-index.bat "C:\Path\To\Your\Repo"
```

### What happens?

1. It runs `gitnexus analyze` to build the graph database (`lbug`).
2. It runs a custom Node.js script (`gitnexus-wiki-local.mjs`) to query that graph database locally and generate a `wiki.md` file.
3. If you specified a custom output destination, it copies `lbug`, `wiki.md`, and `gitnexus.json` to that folder.

---

## 🤖 For AI Agents: Installed Skills

This folder contains three skills that give your AI assistant the ability to manage GitNexus locally:

1. **`gitnexus-local-index`**: Instructs the AI how to ask you for a target repository, run the analysis locally, and generate the wiki.
2. **`gitnexus-local-wiki`**: Instructs the AI how to regenerate just the wiki from an existing index using local Cypher queries.
3. **`gitnexus-local-query`**: Instructs the AI how to query the graph locally using Cypher, semantic search, and impact analysis without needing internet access.

When you ask the AI to "index a repo locally and generate a wiki", it will use these skills and the scripts in this folder to do it automatically.
