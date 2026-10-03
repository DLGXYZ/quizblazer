# QuizBlazer.com

Customer-facing website for the BlazerBox quiz app, aimed at bars, pubs, groups and events.

Plain static site (HTML + CSS, no build step), hosted on GitHub Pages from the `main` branch.

- `index.html`, `features.html`, `events.html`, `pricing.html`: pages
- `assets/style.css`: shared styles
- `assets/site.js`: mobile menu

## Editing the event schedule

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
