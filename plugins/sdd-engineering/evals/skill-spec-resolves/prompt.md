---
description: The user-invoked skill /sdd-engineering:spec resolves under its namespace after install and its instructions load.
tags: [namespace, smoke]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 1
max_turns: 2
timeout_seconds: 120
allowed_tools: [Read]
---

/sdd-engineering:spec Namespace smoke test only. Do not start the workflow, do not launch any agent and do not ask any question. Reply with the exact text of the first Markdown heading of these skill instructions, without the leading # characters, and nothing else.
