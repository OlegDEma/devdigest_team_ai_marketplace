---
description: The user-invoked skill /sdd-engineering:run-plan resolves under its namespace after install and its instructions load.
tags: [namespace, smoke]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review", "../../../security-review"]
runs: 1
max_turns: 2
timeout_seconds: 120
allowed_tools: [Read]
---

/sdd-engineering:run-plan Namespace smoke test only. Do not start the workflow, do not launch any agent and do not read any plan. Reply with the exact text of the first Markdown heading of these skill instructions, without the leading # characters, and nothing else.
