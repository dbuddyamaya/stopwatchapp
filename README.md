# Possession Clock

A phone app with three tools. Open the **☰ menu** (top left) to switch between them. Team names and colors are shared, and each tool keeps its clock running while you look at the other one (the menu shows a green dot next to a tool whose clock is running).

### Possession clock

Two possession stopwatches with analog watch faces, one per team. Tap a team's watch to start it (this pauses the other team). Tap the running watch to pause it, for example when the ball is turned over but the other team doesn't have control yet. Times survive a page refresh or a locked phone.

**Out of bounds** stops both watches when nobody has the ball and it isn't in dispute. Press **Ball in play** to put it back in dispute, or just tap the team that takes possession. The overall clock keeps running through stoppages, and the header shows how much of it was **in play** (possession + dispute) vs **out of play**. The possession bar shows shares of in-play time.

Turn on **Goals** to also keep score here: a scoreboard appears and each team gets a **Goal** button (and **−1** to fix mistakes). A goal works like Out of bounds: it adds to the score and stops play until a team takes possession.

### Scoreboard

For a regular game where you only track goals. Pick the format before kickoff (one period, halves, thirds or quarters, and the minutes for each), then **Start**. The clock counts down and stops by itself at the end of each period, and the button changes to **Start 2nd half** (or the next period). **Pause** / **Resume** stop the clock for injuries. Each team has a big **Goal** button and **−1**; the list at the bottom shows every goal with when it happened and the score after it.

### Winner stays

For sessions with 3 or more teams taking turns. Two teams play; a match lasts a set number of minutes (default 5) **or until the first goal**. The scorer stays on and the other team goes to the back of the line; the next team in line comes on. If time runs out with no goal, the team that has been on more matches in a row leaves. When both have been on equally long (like the very first match), the app asks who stays. **Undo** takes back the last result (for a mis-tapped goal). The team button (top right) edits names and colors, adds or removes teams (3–8) and, before the first match, sets the starting order. The standings table ranks teams by wins, then goal difference. **New session** clears the standings and keeps the teams.

### Light theme

The sun / moon button in the top right switches to a high-contrast **light theme** for reading in sunlight. The choice is saved on the phone; until you pick one, the app follows the phone's own light/dark setting.

## Install on a phone (works offline)

Open the site once while online, then:

- **iPhone:** in Safari tap **Share → Add to Home Screen**.
- **Android:** in Chrome tap **⋮ → Install app** (or **Add to Home screen**).

After that it opens full screen like an app and works with no signal. New versions download in the background the next time it's online. On iPhone the home-screen app keeps its own saved times, separate from Safari.

## Project layout

```
src/
  App.svelte               the ☰ menu and switching between tools, screen wake lock
  components/
    NavDrawer.svelte       slide-out tool menu
    MenuButton.svelte      ☰ button          ThemeButton.svelte   sun / moon button
    IconButton.svelte      shared look for those two buttons
    PossessionView.svelte  Possession clock screen
    OverallBar.svelte      its overall timer, Goals toggle, score, possession and in-play bars
    TeamCard.svelte        one team: name, color, Goal button, watch, possession %
    Dial.svelte            the analog watch face
    ScoreboardView.svelte  Scoreboard screen
    RotationView.svelte    Winner stays screen
    TeamsEditor.svelte     its team list (names, colors, order, add / remove)
    ConfirmDialog.svelte   yes/no dialog for Stop exercise and Reset
  lib/
    teams.svelte.js        team names and colors shared by both tools
    game.svelte.js         possession timing logic (start, pause, out of bounds, goals, stop, reset)
    storage.js             saving the possession game so refreshes keep the times
    scoreboard.svelte.js   scoreboard logic (countdown, periods, goals) and its saving
    rotation.svelte.js     winner stays logic (line of teams, draws, standings, undo) and its saving
    color.js               readable text color on team-colored buttons
    format.js              time formatting
    wakeLock.js            keeps the phone screen on while a clock runs
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
