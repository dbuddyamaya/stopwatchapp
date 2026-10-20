# Possession Clock

Two possession stopwatches, one per team. Tap a team's clock to start it (this pauses the other team). Tap the running clock to pause it, for example when the ball is turned over but the other team doesn't have control yet. Times survive a page refresh or a locked phone.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Render

1. Push this folder to a GitHub repo.
2. In Render: **New → Blueprint**, pick the repo. Render reads `render.yaml` and creates a free static site.
   (Or **New → Static Site** with build command `npm ci && npm run build` and publish directory `dist`.)
