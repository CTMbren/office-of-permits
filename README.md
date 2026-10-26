# Office of Permits

A text-first fantasy incremental game. You are a junior clerk in a city's Office of Permits:
applicants make claims, you decide which claims are worth checking, and later you teach clerks
to do it for you. Something is being built beneath the city.

## Run it

```bash
npm install
npm run dev          # opens on your network too: visit the "Network" URL on your iPhone
npm run check        # everything that must pass before a change is done
npm run build:single # one self-contained dist-single/index.html
```

## Play on iPhone

**Hosted (recommended):** every push to `main` deploys to GitHub Pages
(`https://<your-username>.github.io/<repo-name>/`). One-time setup: repo Settings → Pages →
Source: "GitHub Actions". Open the link in Safari, then Share → Add to Home Screen.

**Local:** run `npm run dev` and open the Network URL in Safari on the same Wi-Fi.

Saves live in the browser on each device. Use the gear icon → Export save to back up or move a save.

See `CLAUDE.md` for the architecture, conventions and current milestone.
