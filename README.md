# Possession Clock

Two possession stopwatches with analog watch faces, one per team. Tap a team's watch to start it (this pauses the other team). Tap the running watch to pause it, for example when the ball is turned over but the other team doesn't have control yet. Times survive a page refresh or a locked phone.

Built with Svelte 5, [Flowbite Svelte](https://flowbite-svelte.com) components (buttons, badge, dialogs, inputs) and Tailwind CSS 4.

## Project layout

```
src/
  App.svelte               page layout and the bottom buttons
  components/
    OverallBar.svelte      overall timer, status and the possession bar
    TeamCard.svelte        one team: name, color, watch, possession %
    Dial.svelte            the analog watch face
    ConfirmDialog.svelte   yes/no dialog for Stop exercise and Reset
  lib/
    game.svelte.js         all timing logic (start, pause, stop, reset)
    storage.js             saving to the browser so refreshes keep the times
    format.js              time formatting
    wakeLock.js            keeps the phone screen on while a watch runs
  app.css                  colors and base styles
```

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Render

1. Push this folder to a GitHub repo.
2. In Render: **New → Blueprint**, pick the repo. Render reads `render.yaml` and creates a free static site.
   (Or **New → Static Site** with build command `npm ci && npm run build` and publish directory `dist`.)
