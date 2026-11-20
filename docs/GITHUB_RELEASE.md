# GitHub release

This document records how the DAYSHIFT working tree was prepared for publication and how the pushed state is verified.

## Repository

| Item | Value |
| --- | --- |
| Local path | `E:\Code\DayShift` |
| Branch | `main` |
| Original commit | `4a48a7d` — `feat: DAYSHIFT fashion commerce and retail operations platform` |
| Release tag | `v1.0.0` |
| Tag policy | unchanged; still points at the original import commit |
| GitHub account | `Mindenry` (authenticated GitHub CLI, `repo` scope) |
| Visibility | private |

The tag is intentionally **not** moved to the release commit. It records the original import; the remediated release is the current head of `main`.

## Pre-publication checks

### Secret scan

| Check | Result |
| --- | --- |
| `.env` ignored by Git | yes (`git check-ignore`) |
| `apps/*/.env.local` ignored | yes |
| `tests/e2e/.env` ignored | yes |
| `backups/` ignored | yes |
| `.mail/` ignored | yes |
| Logs (`*.log`) ignored | yes |
| Private key blocks | none found |
| AWS access key pattern | none found |
| GitHub/GitLab/Slack tokens | none found |
| Stripe live/test keys | none found |
| Google API keys | none found |
| Non-local PostgreSQL URLs in tracked files | none found |
| Database dumps or build output tracked | none |

Tracked `.env.example` contains local placeholders only. Demo account passwords are intentionally documented; they exist only in the seed and are not production credentials.

### Working tree review

- Every modified file was reviewed as part of the audit remediation and LAN work.
- New files are source, tests, PowerShell operations, documentation and application screenshots.
- Temporary probe scripts, audit JSON and debug capture scripts were removed.
- No file was deleted except temporary artifacts.
- Existing volumes, data and the release tag were preserved.

## Publication steps

1. Stage the reviewed project files (`git add -A`, with ignored files excluded by `.gitignore`).
2. Confirm the staged list contains no secrets, logs, dumps or build output.
3. Commit with `chore(release): finalize DAYSHIFT LAN deployment and documentation`.
4. Create the private repository `Mindenry/DAYSHIFT` if it does not exist, or reuse the existing one.
5. Push `main` without force and without rewriting history.
6. Push the existing `v1.0.0` tag if it is not already present.
7. Verify the remote head and upstream tracking.

Commands used:

```powershell
git add -A
git status --short
git commit -m "chore(release): finalize DAYSHIFT LAN deployment and documentation"
gh repo view Mindenry/DAYSHIFT   # create with gh repo create if absent
git push -u origin main
git push origin v1.0.0
git fetch origin
git rev-parse HEAD
git rev-parse origin/main
git status -sb
```

## Verification criteria

The release is verified only when all of the following are true:

- `origin/main` resolves to the release commit (or a later documentation-only commit on the same branch).
- The local branch has an upstream and reports no divergence.
- `git ls-remote origin` lists `refs/heads/main` and `refs/tags/v1.0.0`.
- The tag still resolves to `4a48a7d`.
- A fresh clone or the GitHub web view shows the README, screenshots, deployment docs and operational scripts.
- No secret, database dump, `.env`, log or mail artifact is present in the pushed tree.

## Result

Verified after execution:

| Item | Value |
| --- | --- |
| Release commit | `0464a2d` — `chore(release): finalize DAYSHIFT LAN deployment and documentation` |
| Branch | `main` |
| Remote | `origin` → `https://github.com/Mindenry/DAYSHIFT.git` |
| Upstream | `origin/main` |
| Local head = remote head | yes (`0464a2d`) |
| Tag | `v1.0.0` pushed unchanged; commit `4a48a7d` |
| Repository visibility | private |
| GitHub account | `Mindenry` |

Authentication note: the initial push was rejected because the GitHub CLI OAuth token lacked the `workflow` scope required for `.github/workflows/ci.yml`. The scope was added through GitHub's device authorisation; the subsequent push and tag push succeeded. No history rewrite, force-push or amend was used.

A follow-up documentation commit records these hashes; the GitHub Release itself is represented by the unchanged `v1.0.0` tag plus the release commit on `main`. No new tag was created.

Do not force-push, rebase published history or move the tag. Future changes should be normal commits on `main`.
