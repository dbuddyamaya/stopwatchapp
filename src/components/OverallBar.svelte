<script>
  // Overall timer, the Goals toggle, the possession bar
  // (team 1 / in dispute / team 2, as shares of in-play time) and the
  // in play vs out of play split of the overall time.
  import Toggle from 'flowbite-svelte/Toggle.svelte';
  import { formatTime } from '../lib/format.js';
  import { theme } from '../lib/theme.svelte.js';

  let {
    teams,
    overall,
    disputed,
    share,
    inPlay,
    outOfPlay,
    playShare,
    gameMode = $bindable()
  } = $props();
</script>

<header>
  <div class="mb-2 flex items-center justify-between gap-3">
    <div class="flex shrink-0 flex-col">
      <span class="text-[0.65rem] leading-tight font-semibold tracking-widest text-(--muted) uppercase">Overall</span>
      <span class="text-2xl leading-none font-semibold tabular-nums">{formatTime(overall)}</span>
    </div>
    <div class="flex min-w-0 items-center gap-2.5">
      <Toggle size="small" bind:checked={gameMode} class="shrink-0 text-sm text-(--text)">Goals</Toggle>
      <button
        class="theme"
        onclick={() => theme.toggle()}
        aria-label={theme.current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        title={theme.current === 'dark' ? 'Light theme (for sunlight)' : 'Dark theme'}
      >
        {#if theme.current === 'dark'}
          <!-- sun -->
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
          </svg>
        {:else}
          <!-- moon -->
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
          </svg>
        {/if}
      </button>
    </div>
  </div>

  {#if gameMode}
    <div class="score mb-2" aria-label="Score">
      <span class="name" style="color:{teams[0].color}">{teams[0].name}</span>
      <span class="nums tabular-nums">{teams[0].score} – {teams[1].score}</span>
      <span class="name right" style="color:{teams[1].color}">{teams[1].name}</span>
    </div>
  {/if}

  <div class="flex h-3.5 overflow-hidden rounded-full bg-(--track)" aria-label="Share of in-play time">
    <div class="seg" style="width:{share[0]}%; background:{teams[0].color}"></div>
    <div class="seg" style="width:{share[1]}%; background:var(--dispute)"></div>
    <div class="seg" style="width:{share[2]}%; background:{teams[1].color}"></div>
  </div>

  <div class="mt-1.5 flex justify-between text-sm text-(--muted) tabular-nums">
    <span>{share[0].toFixed(0)}%</span>
    <span class="inline-flex items-center gap-1.5">
      <span class="size-2 rounded-full" style="background:var(--dispute)"></span>
      In dispute {formatTime(disputed)} · {share[1].toFixed(0)}%
    </span>
    <span>{share[2].toFixed(0)}%</span>
  </div>

  <div class="mt-2 flex h-1.5 overflow-hidden rounded-full bg-(--track)" aria-label="In play vs out of play">
    <div class="seg" style="width:{playShare[0]}%; background:var(--in-play)"></div>
    <div class="seg" style="width:{playShare[1]}%; background:var(--out-of-play)"></div>
  </div>

  <div class="mt-1 flex justify-between gap-2 text-xs text-(--muted) tabular-nums">
    <span class="inline-flex items-center gap-1.5">
      <span class="size-2 rounded-full" style="background:var(--in-play)"></span>
      In play {formatTime(inPlay)} · {playShare[0].toFixed(0)}%
    </span>
    <span class="inline-flex items-center gap-1.5">
      Out of play {formatTime(outOfPlay)} · {playShare[1].toFixed(0)}%
      <span class="size-2 rounded-full" style="background:var(--out-of-play); outline: 1px solid var(--muted)"></span>
    </span>
  </div>
</header>

<style>
  .seg {
    transition: width 0.3s linear;
  }
  .theme {
    flex-shrink: 0;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    touch-action: manipulation;
  }
  .theme svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .score {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
  }
  .score .name {
    font-weight: 600;
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .score .right {
    text-align: right;
  }
  .score .nums {
    font-size: 1.75rem;
    line-height: 1;
    font-weight: 700;
  }
</style>
