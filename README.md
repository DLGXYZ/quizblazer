# QuizBlazer.com

Customer-facing website for the BlazerBox quiz app, aimed at bars, pubs, groups and events.

Plain static site (HTML + CSS, no build step), hosted on GitHub Pages from the `main` branch.

- `index.html`, `features.html`, `events.html`, `pricing.html`: pages
- `assets/style.css`: shared styles
- `assets/site.js`: mobile menu

## Editing the event schedule

The easy way is the schedule editor at `admin.html` (https://dlgxyz.github.io/quizblazer/admin.html, later
https://quizblazer.com/admin.html). It is a form, so the file always comes out valid. It is not linked from the site
and is hidden from search engines; only someone with your GitHub key can save.

One-time setup (make a GitHub key):

1. On github.com, click your profile picture (top right), then **Settings**.
2. In the left menu, scroll to the bottom and click **Developer settings**.
3. Click **Personal access tokens**, then **Fine-grained tokens**, then **Generate new token**.
4. Name it `QuizBlazer schedule`. Set **Expiration** to 1 year (or whatever you like).
5. Under **Repository access**, pick **Only select repositories** and choose `DLGXYZ/quizblazer`.
6. Under **Permissions**, click **Add permissions**, choose **Contents**, and set it to **Read and write**.
7. Click **Generate token** and copy the key (it starts with `github_pat_`). GitHub only shows it once.
8. Open the editor page, paste the key, leave "Remember this key on this device" ticked, and press **Connect**.

Using it: **Add a game** or **Edit**/**Delete** a game, press **Keep this game**, then **Publish to website**.
The Events page and the CrowPanel pick up the change about a minute later. Past games stay in the list (faded)
until you delete them; the Events page already hides them.

Editing the file by hand still works, as described below.

Every game on the Events page comes from `events.json`. The CrowPanel venue display reads the same file from
`https://dlgxyz.github.io/quizblazer/events.json` (later `https://quizblazer.com/events.json`), so this is the only place to edit.

Each game looks like this:

```json
{
  "title": "Night of the Living Sooky, Smoky, Sudsy Trivia",
  "date": "2026-10-22",
  "time": "18:30",
  "venue": "Little Lake Brewing",
  "city": "Lakeville",
  "state": "NY",
  "note": ""
}
```

- `date` is year-month-day, `time` is 24-hour (18:30 is 6:30 PM).
- Separate games with a comma; the page sorts them by date and hides ones that have passed.
- `note` is optional extra text (theme, prizes, "all ages"); leave it as `""` if not needed.
- Update `updated` at the top to the day you edit.

To preview locally, open `index.html` in a browser.
