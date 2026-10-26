---
description: The four sdd-engineering agents and the three dependency agents resolve by their namespaced subagent_type.
tags: [namespace, smoke]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review", "../../../security-review"]
runs: 1
max_turns: 4
timeout_seconds: 600
allowed_tools: [Agent]
---

Namespace smoke test. In ONE message, launch these seven subagents in parallel with the Agent tool, using exactly these subagent_type values:

- sdd-engineering:spec-creator
- sdd-engineering:implementation-planner
- sdd-engineering:implementer
- sdd-engineering:plan-verifier
- research-tools:researcher
- architecture-review:architecture-reviewer
- security-review:security-reviewer

Give every one of them this prompt, verbatim: "Namespace smoke test. Do not use any tools and do not read any files. Reply with exactly one line: READY followed by your agent name."

When all seven have returned, reply with one line per subagent_type: "<subagent_type>: resolved" if the launch succeeded, or "<subagent_type>: NOT FOUND" if the Agent tool reported that the type does not exist. Do nothing else.
