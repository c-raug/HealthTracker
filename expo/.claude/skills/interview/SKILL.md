---
name: interview
description: Interview & Planning Skill. Invoke automatically when the user mentions planning new features, updates, or improvements to the app, or asks "what should I work on next". Conducts a structured interview using AskUserQuestion to clarify details for a GitHub issue.
---

# Interview & Planning Skill

You are helping the user clarify and flesh out an idea for their HealthTracker app. Your job is to conduct a thorough interview using `AskUserQuestion`, asking as many questions as needed until you have enough detail to produce a complete, unambiguous GitHub issue. This skill is designed to be called standalone or from within the `/ci` skill.

## When to invoke

Invoke this skill automatically whenever the user mentions:
- Planning new features or updates
- Changes they want to make to the app
- Ideas for improvements
- "What should I work on next" style questions

Also invoked explicitly via `/interview`.

## Step 1 — Gather the idea

If the user has already described an idea in their message, move to Step 2.

Otherwise, use `AskUserQuestion` to ask:

> "What update or feature are you thinking about? Describe the idea and I'll help flesh it out."

## Step 2 — Interview to clarify details

For the idea provided, use `AskUserQuestion` repeatedly — as many times as needed — to drill into every ambiguous area until you have zero open questions. Ask about:

- **UX behavior**: What exactly does the user see/tap/experience? What is the before and after?
- **Edge cases**: What happens if the list is empty, the value is zero, the user cancels mid-flow?
- **Affected components**: Which screens, tabs, or components are involved?
- **Data / state changes**: Does this require new reducer actions, new state fields, or changes to AsyncStorage?
- **Constraints**: Any design token, pattern, or architectural rules from CLAUDE.md that apply?
- **Scope**: What is explicitly in scope and what is not?
- **Priority**: How important is this relative to other work? (helps determine timeline label)

**Rules for interviewing:**
- Ask one `AskUserQuestion` call per ambiguous area. Do NOT batch multiple unrelated questions into one call — keep each question focused.
- Keep drilling until you have no open questions. It is better to ask too many questions than too few.
- Use your knowledge of the codebase (from CLAUDE.md and file reads as needed) to ask informed questions. For example, if the user says "add a graph to the weight tab", you should already know `WeightChart.tsx` exists and ask whether they want to modify it or add a new component.
- If the user's answer introduces new ambiguity, ask follow-up questions about that too.
- When you believe you have enough detail, confirm with the user by summarizing what you understood and asking if anything is missing.

## Step 3 — Return structured issue content

Once the idea is fully clarified, produce the following structured output. This is the same format used by the `/ci` skill for GitHub issues:

### Issue Format

```markdown
## Title
{Clear, descriptive title — action-oriented, e.g. "Add weekly weight trend summary to Weight tab"}

## Labels
- **Type:** {bug | improvement | feature}
- **Page:** {weight | nutrition | activity | settings | global}
- **Timeline:** {short-term | medium-term | long-term}

## Description
{2-4 sentences describing the problem, motivation, or what this adds. Explain WHY this matters to the user.}

## Technical Implementation
{What needs to change in the codebase. Reference specific files, components, reducer actions, state fields, and patterns from CLAUDE.md where relevant. Keep it focused — enough for an AI or developer to implement without guessing, but not overkill.}

- `path/to/file.tsx` — what changes here
- `path/to/other.tsx` — what changes here
- New state/actions needed (if any)
- Patterns to follow (reference CLAUDE.md patterns)

## Acceptance Criteria
{Bulleted checklist of what "done" looks like. Each item should be independently verifiable.}

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

### When called from `/ci`

The `/ci` skill calls `/interview` for each idea to gather details. The structured issue content produced in Step 3 is returned to `/ci`, which then handles approval, label creation, GitHub issue creation, and project board placement. Do NOT create GitHub issues directly — just return the structured content.

### When called standalone

If invoked standalone (not from `/ci`), present the structured issue to the user using `AskUserQuestion` and ask if they want to create it as a GitHub issue now. If yes, hand off to the `/ci` skill's issue creation flow (labels, GitHub issue, project board).

## Step 4 — Confirm

After producing the structured issue, tell the user:
- A brief summary of what was captured
- That the issue is ready for creation (or has been passed back to `/ci`)
