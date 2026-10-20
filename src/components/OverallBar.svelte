<script>
  // Overall timer, status and the three-part bar: team 1 / in dispute / team 2.
  import Badge from 'flowbite-svelte/Badge.svelte';
  import { formatTime } from '../lib/format.js';

  let { teams, overall, disputed, share, status, statusColor } = $props();
</script>

<header>
  <div class="mb-2 flex items-center justify-between gap-3">
    <div class="flex items-baseline gap-2">
      <span class="text-xs font-semibold tracking-widest text-gray-400 uppercase">Overall</span>
      <span class="text-2xl leading-none font-semibold tabular-nums">{formatTime(overall)}</span>
    </div>
    <Badge color={statusColor} class="truncate">{status}</Badge>
  </div>

  <div class="flex h-3.5 overflow-hidden rounded-full bg-gray-800" aria-label="Share of overall time">
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
</header>

<style>
  .seg {
    transition: width 0.3s linear;
  }
</style>
