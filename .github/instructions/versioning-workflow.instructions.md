---
description: "Use when planning or implementing any feature, bugfix, refactor, release, architecture note, or project documentation update in devcollab-ai. Enforces branch workflow, versioning discipline, and local-only docs handling."
name: "Versioning Workflow And Local Docs"
applyTo: "**"
---

# Versioning Workflow And Local Docs Rules

- Treat these rules as hard constraints for all coding tasks in this workspace.
- Never work directly on main for feature work.
- Always use a separate branch for each feature or major fix.
- Recommended branch naming:
  - Feature: feat/<short-scope>
  - Fix: fix/<short-scope>
  - Docs-only local planning: docs-local/<short-scope>
- Before implementing non-trivial work:
  - Confirm current branch
  - If on main, create/switch to a new branch first

## Versioning Discipline

- Keep release versioning semantic: MAJOR.MINOR.PATCH.
- For user-visible feature changes, prepare a MINOR version bump candidate.
- For bugfix-only changes, prepare a PATCH version bump candidate.
- For breaking changes, prepare a MAJOR version bump candidate.
- Record version-impact notes in a changelog-style summary when requested.

## Local Documentation Policy (Must Stay Untracked)

- Architecture and user-manual documents must live under local-docs/.
- local-docs/ content is local working documentation and must not be committed.
- Never add local-docs/ files to git staging.
- Keep architecture notes and user manual updates detailed and current in local-docs/.

## Documentation Minimum Content

- Architecture docs should include:
  - System overview and runtime model
  - Auth and security flow
  - Realtime/socket flow
  - API surface by domain
  - Data model summaries
  - Deployment and environment notes
- User manual should include:
  - Setup and login/register flow
  - Workspace/channel/DM usage
  - AI panel usage and modes
  - Snippet and file workflows
  - Search and notifications usage
  - Troubleshooting checklist
