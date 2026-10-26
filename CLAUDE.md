# Project notes for Claude Code

## Commits & deployment — IMPORTANT
- This repo **auto-deploys to Netlify** on every push to `main`.
- Netlify's plan **blocks builds from this private repo unless the commit author
  is a GitHub identity linked to the Netlify account.** The linked identity is the
  **SMPharmacy** GitHub account. Therefore:
  - **Author every commit as SMPharmacy** — this repo's git config is set to
    `user.name = SMPharmacy`,
    `user.email = 348308575+SMPharmacy@users.noreply.github.com`. Do not change it.
  - **Never add a `Co-Authored-By:` trailer** (it adds a second, unverified
    contributor and blocks the build).
- A `commit-msg` hook (`.githooks/commit-msg`, enabled via
  `git config core.hooksPath .githooks`) strips any `Co-authored-by` line
  automatically, as a safety net.

## About the site
- Static HTML/CSS/JS, **no build step**. Netlify publishes the repo root.
- Secrets live **only** in Netlify environment variables (see `.env.example`),
  never in the files.
- `netlify/functions/send-nomination.js` emails EPS nominations via Resend
  (`RESEND_API_KEY`, set in Netlify).
- The contact "booking" form uses Netlify Forms; the EPS form uses the function.
- See `HOW-TO-UPDATE.md` for the edit → push → auto-deploy workflow.
