---
description: The dependency skill engineering-paved-path:architecture (preloaded by implementation-planner) resolves under its namespace.
tags: [namespace, smoke]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review", "../../../security-review"]
runs: 1
max_turns: 3
timeout_seconds: 120
allowed_tools: [Skill]
---

Namespace smoke test. Load the skill engineering-paved-path:architecture with the Skill tool, using exactly that name. Then reply in one sentence that starts with "Loaded engineering-paved-path:architecture" and names one rule from it. Do not use any other tool.
