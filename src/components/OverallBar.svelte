<script>
  // Overall timer, status, the Goals toggle, the possession bar
  // (team 1 / in dispute / team 2, as shares of in-play time) and the
  // in play vs out of play split of the overall time.
  import Badge from 'flowbite-svelte/Badge.svelte';
  import Toggle from 'flowbite-svelte/Toggle.svelte';
  import { formatTime } from '../lib/format.js';

  let {
    teams,
    overall,
    disputed,
    share,
    inPlay,
    outOfPlay,
    playShare,
    gameMode = $bindable(),
    status,
    statusColor
  } = $props();
</script>

<header>
  <div class="mb-2 flex items-center justify-between gap-3">
    <div class="flex items-baseline gap-2">
      <span class="text-xs font-semibold tracking-widest text-gray-400 uppercase">Overall</span>
      <span class="text-2xl leading-none font-semibold tabular-nums">{formatTime(overall)}</span>
    </div>
    <div class="flex min-w-0 items-center gap-3">
      <Toggle size="small" bind:checked={gameMode} class="shrink-0 text-sm text-gray-300">Goals</Toggle>
      <Badge color={statusColor} class="truncate">{status}</Badge>
    </div>
  </div>

  {#if gameMode}
    <div class="score mb-2" aria-label="Score">
      <span class="name" style="color:{teams[0].color}">{teams[0].name}</span>
      <span class="nums tabular-nums">{teams[0].score} – {teams[1].score}</span>
      <span class="name right" style="color:{teams[1].color}">{teams[1].name}</span>
    </div>
  {/if}

  <div class="flex h-3.5 overflow-hidden rounded-full bg-gray-800" aria-label="Share of in-play time">
    <div class="seg" style="width:{share[0]}%; background:{teams[0].color}"></div>
    <div class="seg" style="width:{share[1]}%; background:var(--dispute)"></div>
    <div class="seg" style="width:{share[2]}%; background:{teams[1].color}"></div>
  </div>

  <div class="mt-1.5 flex justify-between text-sm text-gray-400 tabular-nums">
    <span>{share[0].toFixed(0)}%</span>
    <span class="inline-flex items-center gap-1.5">
      <span class="size-2 rounded-full" style="background:var(--dispute)"></span>
      In dispute {formatTime(disputed)} · {share[1].toFixed(0)}%
    </span>
    <span>{share[2].toFixed(0)}%</span>
  </div>

  <div class="mt-2 flex h-1.5 overflow-hidden rounded-full bg-gray-800" aria-label="In play vs out of play">
    <div class="seg" style="width:{playShare[0]}%; background:var(--in-play)"></div>
    <div class="seg" style="width:{playShare[1]}%; background:var(--out-of-play)"></div>
  </div>

  <div class="mt-1 flex justify-between gap-2 text-xs text-gray-400 tabular-nums">
    <span class="inline-flex items-center gap-1.5">
      <span class="size-2 rounded-full" style="background:var(--in-play)"></span>
      In play {formatTime(inPlay)} · {playShare[0].toFixed(0)}%
    </span>
    <span class="inline-flex items-center gap-1.5">
      Out of play {formatTime(outOfPlay)} · {playShare[1].toFixed(0)}%
      <span class="size-2 rounded-full" style="background:var(--out-of-play); outline: 1px solid #5b6572"></span>
    </span>
  </div>
</header>

<style>
  .seg {
    transition: width 0.3s linear;
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
