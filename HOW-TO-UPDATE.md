# How to update the St Matthew's Pharmacy website

Your website now deploys **automatically**. You edit the files, send the changes
to GitHub, and Netlify publishes them to the live site within about a minute.

- **Code lives on GitHub:** https://github.com/SMPharmacy/stmatthews-pharmacy
- **Netlify publishes it** to your domain whenever the `main` branch changes.
- **The project folder** is on your PC (wherever you opened it in Claude Code).

---

## The 3-step update (the normal way)

1. **Make your change** — edit any file in the website folder (e.g. a price in
   `travel-clinic.html`), or ask Claude Code to make it.

2. **Send it to GitHub.** Open a terminal **in the website folder** and run these
   three commands, one at a time:

   ```bash
   git add -A
   git commit -m "Describe what you changed"
   git push
   ```

   (Change the words in quotes to whatever you changed, e.g.
   `git commit -m "Updated travel vaccine prices"`.)

3. **Wait ~1 minute.** Netlify sees the push and rebuilds the site automatically.
   Watch progress at https://app.netlify.com → your site → **Deploys**. When it
   says **Published**, your change is live on stmatthewspharmacy.co.uk.

That's it. You never drag-and-drop a folder onto Netlify again.

---

## Prefer clicking to typing? (GitHub Desktop)

If the commands feel fiddly, install **GitHub Desktop** (https://desktop.github.com):

1. Sign in as **SMPharmacy** and open the `stmatthews-pharmacy` repository.
2. After editing files, it lists your changes. Type a short summary, click
   **Commit to main**, then click **Push origin**.
3. Netlify deploys automatically, exactly as above.

---

## Good to know

- **If `git push` times out** with a "host failed to respond" message, it's just
  the network — wait a few seconds and run `git push` again. (This pharmacy's
  network is occasionally slow reaching GitHub.)
- **Secrets never go in the files.** The email key (`RESEND_API_KEY`) lives only
  in Netlify → Site configuration → Environment variables. See `.env.example`
  for the list. Never paste real keys into the website files.
- **The two forms** keep working automatically:
  - *Contact "booking" form* → handled by Netlify Forms (submissions appear in
    Netlify → Forms).
  - *EPS nomination form* → emails the pharmacy via the Netlify function
    (`netlify/functions/send-nomination.js`), using the Resend key above.
- **Preview before going live (optional):** make changes on a different branch
  and open a Pull Request on GitHub — Netlify builds a temporary preview link so
  you can check it before merging to `main`.
- **Rollback:** in Netlify → Deploys, open any previous working deploy and click
  **Publish deploy** to instantly revert.
- **Original master images** (the large PNG/JPGs) were moved out of the website
  folder to keep deploys fast; they're kept in a separate local backup folder.
