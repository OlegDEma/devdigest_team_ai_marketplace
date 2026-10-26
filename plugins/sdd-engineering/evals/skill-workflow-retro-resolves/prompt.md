---
description: The user-invoked skill /sdd-engineering:workflow-retro resolves under its namespace after install and its instructions load.
tags: [namespace, smoke]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 1
max_turns: 2
timeout_seconds: 120
allowed_tools: [Read]
---

/sdd-engineering:workflow-retro Namespace smoke test only. Do not run any command or script and do not write any file. Reply with the exact text of the first Markdown heading of these skill instructions, without the leading # characters, and nothing else.
