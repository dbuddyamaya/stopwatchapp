<script module>
  // Where you are in the library. Kept while you switch tools and across a
  // reload (the app reloads itself after an update).
  const KEY = 'drills-place';
  let saved = { folder: null, drill: null };
  try {
    saved = { ...saved, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    // storage unavailable
  }
  let place = $state(saved);
</script>

<script>
  // Drills tool: folders (A–Z) → drills in a folder → one drill with its
  // video, description, setup and coaching points.
  import { onMount } from 'svelte';
  import { folders, allVideos } from '../lib/drills.js';
  import { offlineVideos } from '../lib/offlineVideos.svelte.js';
  import MenuButton from './MenuButton.svelte';
  import ThemeButton from './ThemeButton.svelte';
  import IconButton from './IconButton.svelte';

  let { onmenu } = $props();

  let folder = $derived(folders.find((f) => f.id === place.folder) ?? null);
  let drill = $derived(folder?.drills.find((d) => d.id === place.drill) ?? null);
  let title = $derived(drill?.name ?? folder?.name ?? 'Drills');

  const count = (n) => (n === 0 ? 'No drills yet' : n === 1 ? '1 drill' : `${n} drills`);

  function back() {
    if (place.drill) place.drill = null;
    else place.folder = null;
  }

  $effect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(place));
    } catch {
      // storage unavailable
    }
  });

  let scroller;
  // Start each screen at the top
  $effect(() => {
    place.folder;
    place.drill;
    scroller?.scrollTo(0, 0);
  });

  // Save every drill video on the phone for offline use (when there's signal)
  onMount(() => {
    offlineVideos.sync(allVideos);
    const again = () => offlineVideos.sync(allVideos);
    addEventListener('online', again);
    return () => removeEventListener('online', again);
  });

  const offlineText = (url) =>
    ({ saved: 'Saved for offline', saving: 'Saving for offline…' })[offlineVideos.status[url]] ??
    (offlineVideos.supported ? 'Needs signal to play (saves when online)' : '');
</script>

<main>
  <header class="flex items-center justify-between gap-3">
    <div class="flex min-w-0 items-center gap-2.5">
      {#if folder}
        <IconButton label="Back" onclick={back}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </IconButton>
      {:else}
        <MenuButton onclick={onmenu} />
      {/if}
      <div class="flex min-w-0 flex-col">
        {#if drill}<span class="crumb">{folder.name}</span>{/if}
        <span class="truncate text-lg leading-tight font-semibold">{title}</span>
      </div>
    </div>
    <ThemeButton />
  </header>

  <div class="content" bind:this={scroller}>
    {#if drill}
      <!-- One drill -->
      <video
        class="video"
        src={drill.video}
        poster={drill.poster}
        controls
        playsinline
        preload="metadata"
      >
        <track kind="captions" />
      </video>
      {#if offlineText(drill.video)}
        <p class="offline" class:saved={offlineVideos.status[drill.video] === 'saved'}>
          {offlineText(drill.video)}
        </p>
      {/if}

      {#if drill.description}
        <section class="card">
          <h2>About</h2>
          <p>{drill.description}</p>
        </section>
      {/if}
      {#if drill.setup?.length}
        <section class="card">
          <h2>Setup</h2>
          <ul>{#each drill.setup as item}<li>{item}</li>{/each}</ul>
        </section>
      {/if}
      {#if drill.coaching?.length}
        <section class="card">
          <h2>Coaching points</h2>
          <ul>{#each drill.coaching as item}<li>{item}</li>{/each}</ul>
        </section>
      {/if}
      {#if drill.steps?.length}
        <section class="card">
          <h2>How it runs</h2>
          <ol>{#each drill.steps as item}<li>{item}</li>{/each}</ol>
        </section>
      {/if}
    {:else if folder}
      <!-- Drills in a folder -->
      {#if folder.drills.length === 0}
        <p class="empty">No drills in {folder.name} yet.</p>
      {:else}
        <ul class="rows">
          {#each folder.drills as d (d.id)}
            <li>
              <button class="row" onclick={() => (place.drill = d.id)}>
                {#if d.poster}
                  <img class="thumb" src={d.poster} alt="" loading="lazy" />
                {:else}
                  <span class="thumb icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7.5v9l7.5-4.5z" /></svg>
                  </span>
                {/if}
                <span class="text">
                  <span class="name">{d.name}</span>
                  {#if d.description}<span class="desc">{d.description}</span>{/if}
                </span>
                {#if offlineVideos.status[d.video] === 'saved'}
                  <span class="tick" title="Saved for offline">✓</span>
                {/if}
                <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    {:else}
      <!-- Folders -->
      <ul class="rows">
        {#each folders as f (f.id)}
          <li>
            <button class="row" onclick={() => (place.folder = f.id)}>
              <span class="thumb icon folder">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2h9A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />
                </svg>
              </span>
              <span class="text">
                <span class="name">{f.name}</span>
                <span class="desc">{count(f.drills.length)}</span>
              </span>
              <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</main>

<style>
  main {
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 12px 0;
    padding-top: max(10px, env(safe-area-inset-top));
    max-width: 900px;
    margin: 0 auto;
  }
  .crumb {
    font-size: 0.72rem;
    color: var(--muted);
    line-height: 1.1;
  }
  .content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    color: var(--text);
    text-align: left;
    cursor: pointer;
    touch-action: manipulation;
  }
  .row:active {
    transform: scale(0.99);
  }
  .thumb {
    width: 64px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 8px;
    object-fit: cover;
    background: var(--bg);
  }
  .thumb.icon {
    display: grid;
    place-items: center;
  }
  .thumb.folder {
    width: 44px;
    height: 44px;
    color: #3b82f6;
  }
  .thumb svg,
  .chev {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .chev {
    width: 18px;
    height: 18px;
    color: var(--muted);
    flex-shrink: 0;
  }
  .text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .name {
    font-weight: 600;
  }
  .desc {
    font-size: 0.82rem;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tick {
    color: #22c55e;
    font-weight: 700;
    font-size: 0.85rem;
  }
  .empty {
    color: var(--muted);
    text-align: center;
    padding: 32px 12px;
    background: var(--surface);
    border: 1px dashed var(--border);
    border-radius: 14px;
  }

  .video {
    width: 100%;
    max-height: 60dvh;
    background: #000;
    border-radius: 14px;
    flex-shrink: 0;
  }
  .offline {
    font-size: 0.78rem;
    color: var(--muted);
    margin-top: -4px;
  }
  .offline.saved {
    color: #22c55e;
  }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 12px 14px;
  }
  h2 {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .card p {
    line-height: 1.45;
  }
  .card ol {
    list-style: decimal;
    padding-left: 1.3rem;
    display: flex;
    flex-direction: column;
    gap: 4px;
    line-height: 1.4;
  }
  .card ul {
    list-style: disc;
    padding-left: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 4px;
    line-height: 1.4;
  }
</style>
