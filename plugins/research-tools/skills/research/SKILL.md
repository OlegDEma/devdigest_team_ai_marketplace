---
name: research
description: "/research-tools:research — quick entry point for read-only research with the `research-tools:researcher` agent. Turns the user's request into one or more concrete questions, picks the mode (repository, external, or both), launches one researcher per question in parallel, and returns the reports unchanged, optionally saving them to `docs/research/`. Use when the user asks to research, investigate or look something up (\"research how X works\", \"find out whether library Y supports Z\", \"what did we decide about W\", /research-tools:research). Never edits code."
argument-hint: "<question or topic> [save]"
metadata:
  tags: research, investigation, read-only, agent
---

# Research

Run read-only research with the `research-tools:researcher` agent (or `research-tools:investigator` for purely structural questions) from the main session. This skill shapes the request; the agent does the research and writes the report.

Input: `$ARGUMENTS` — a question, a topic, or several questions. The word `save` anywhere in it means "also save the reports to files".

## 1. Turn the request into questions

1. Split the input into **independent questions**, at most 4. Two questions are independent when neither answer changes how you would research the other. Merge the rest.
2. For each question decide the **mode**:
   - **R (repository)** — about this codebase, its history or recorded decisions;
   - **E (external)** — about libraries, APIs, versions, standards, upstream issues;
   - **R+E** — needs both (for example "does our usage of X match the current docs").
   - **S (structural)** — purely structural: where a symbol is defined, who imports or calls it, every consumer of a field, the blast radius of a stated change. No *why*, history or external behaviour.
3. Make every question **concrete**: one thing to find out, the scope (paths, library and version, time range) and what the answer is for. If the input is only a topic and you cannot write a concrete question without guessing, ask the user up to 3 short questions first and stop. Do not launch the agent on a bare topic: it will only ask the same questions back.

Show the user the list before launching, one line each: `Q1 [R] <question>`. Do not wait for confirmation unless something in step 3 was unclear.

## 2. Launch the researchers

Launch one agent per question, **all in one message**, so they run in parallel. Always pass the full namespace: `subagent_type: "research-tools:researcher"` for R, E and R+E questions, and `subagent_type: "research-tools:investigator"` for S questions (for an S question, state the symbol or the exact change, and the scope). The prompt for each agent:

```text
Mode: <R | E | R+E | S>
Question: <the concrete question>
Scope: <paths, library@version, dates; or "whole repository">
Why: <what the answer will be used for>
Already known: <path:line or URLs the user or you already have, or "nothing">
```

If the agent replies with **Clarification needed**, relay its questions to the user as-is, wait for the answers, and resume the same agent with them. Do not answer on the user's behalf.

## 3. Return the results

1. Show each report **unchanged**, in question order. Do not merge, shorten or re-rank findings: the citations and the "Not found / unverified" list are the point.
2. After the reports, add at most 5 lines of your own: where the answers agree or conflict, and the obvious next step. Mark anything you add as yours, not the agent's.
3. If the input contained `save`, write each report to `docs/research/YYYY-MM-DD-<slug>.research.md` (today's date, a short kebab-case slug of the question), unless the project's conventions file (`CLAUDE.md`, `AGENTS.md`) names another location. Tell the user the paths. This is the only file this skill writes.

## Rules

- Read-only: never edit code, configs or docs because of what the research found. Propose changes; the user decides.
- One concrete question per agent. More than 4 questions → ask the user which 4 matter now.
- Do not research yourself in the main session; the agent's budget, citations and "Not found" discipline are why this skill exists.
- A question that mixes structure with *why* or history goes to `researcher` (mode R); split it only if the structural part is large.
- If `research-tools:researcher` (or `research-tools:investigator` for S questions) is not available, say that the `research-tools` plugin is not installed or not enabled, and stop.
