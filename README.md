# Possession Clock

Two possession stopwatches with analog watch faces, one per team. Tap a team's watch to start it (this pauses the other team). Tap the running watch to pause it, for example when the ball is turned over but the other team doesn't have control yet. Times survive a page refresh or a locked phone.

**Out of bounds** stops both watches when nobody has the ball and it isn't in dispute. Press **Ball in play** to put it back in dispute, or just tap the team that takes possession. The overall clock keeps running through stoppages, and the header shows how much of it was **in play** (possession + dispute) vs **out of play**. The possession bar shows shares of in-play time.

Turn on **Goals** for a game: a scoreboard appears and each team gets a **Goal** button (and **−1** to fix mistakes). A goal works like Out of bounds: it adds to the score and stops play until a team takes possession.

The sun / moon button in the top right switches to a high-contrast **light theme** for reading in sunlight. The choice is saved on the phone; until you pick one, the app follows the phone's own light/dark setting.

Built with Svelte 5, [Flowbite Svelte](https://flowbite-svelte.com) components (buttons, badge, dialogs, inputs) and Tailwind CSS 4.

## Install on a phone (works offline)

Open the site once while online, then:

- **iPhone:** in Safari tap **Share → Add to Home Screen**.
- **Android:** in Chrome tap **⋮ → Install app** (or **Add to Home screen**).

After that it opens full screen like an app and works with no signal. New versions download in the background the next time it's online. On iPhone the home-screen app keeps its own saved times, separate from Safari.

## Project layout

```
src/
  App.svelte               page layout and the bottom buttons
  components/
    OverallBar.svelte      overall timer, Goals toggle, score, possession and in-play bars
    TeamCard.svelte        one team: name, color, Goal button, watch, possession %
    Dial.svelte            the analog watch face
    ConfirmDialog.svelte   yes/no dialog for Stop exercise and Reset
  lib/
    game.svelte.js         all timing logic (start, pause, out of bounds, goals, stop, reset)
    storage.js             saving to the browser so refreshes keep the times
    format.js              time formatting
    wakeLock.js            keeps the phone screen on while a watch runs
    theme.svelte.js        light / dark theme switch
  app.css                  colors (dark and light) and base styles
```

## Run locally

```bash
npm install
npm run dev
```

Offline support only runs in the built app. To try it on your computer: `npm run build`, then `npm run preview`.

## Deploy to Render

1. Push this folder to a GitHub repo.
2. In Render: **New → Blueprint**, pick the repo. Render reads `render.yaml` and creates a free static site.
   (Or **New → Static Site** with build command `npm ci && npm run build` and publish directory `dist`.)
