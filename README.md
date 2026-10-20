# Possession Clock

Possession stopwatches for a training exercise: one analog watch per team plus an overall exercise watch.

- The exercise watch starts the first time you tap either team's watch.
- Tap a team's watch when they have control of the ball. This pauses the other team.
- Tap the running watch when the ball is lost. That time counts as "in dispute" until a team has control again.
- **End exercise** stops every watch and keeps the final numbers on screen. **New exercise** clears them.
- The overview shows each team's time, disputed time, and each one's share of the whole exercise.
- Times survive a page refresh or a locked phone.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Render

1. Push this folder to a GitHub repo.
2. In Render: **New → Blueprint**, pick the repo. Render reads `render.yaml` and creates a free static site.
   (Or **New → Static Site** with build command `npm ci && npm run build` and publish directory `dist`.)
