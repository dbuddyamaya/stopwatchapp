<script>
  import { onMount } from 'svelte';

  const STORAGE_KEY = 'possession-clock-v1';

  const defaults = () => ({
    teams: [
      { name: 'Team 1', color: '#2f80ed', accumulated: 0 },
      { name: 'Team 2', color: '#eb5757', accumulated: 0 }
    ],
    running: null, // index of the team whose clock is running, or null
    startedAt: null // Date.now() when the running clock last started
  });

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.teams) && saved.teams.length === 2) return saved;
      }
    } catch {
      // storage unavailable or corrupt: start fresh
    }
    return defaults();
  }

  let state = $state(load());
  let now = $state(Date.now());

  // Persist on every change. Elapsed time is derived from timestamps,
  // so a refresh or a locked phone never loses time.
  $effect(() => {
    const snapshot = JSON.stringify(state);
    try {
      localStorage.setItem(STORAGE_KEY, snapshot);
    } catch {
      // ignore
    }
  });

  function elapsed(i) {
    const t = state.teams[i];
    const live = state.running === i && state.startedAt ? now - state.startedAt : 0;
    return t.accumulated + Math.max(0, live);
  }

  let times = $derived([elapsed(0), elapsed(1)]);
  let total = $derived(times[0] + times[1]);
  let pct = $derived(
    total > 0 ? [(times[0] / total) * 100, (times[1] / total) * 100] : [50, 50]
  );

  function stopRunning() {
    if (state.running !== null) {
      const t = Date.now();
      state.teams[state.running].accumulated += t - state.startedAt;
      state.running = null;
      state.startedAt = null;
      now = t;
    }
  }

  // Tap a team: if it's running, pause it. Otherwise pause whoever is running
  // and start this team. Both clocks can be paused (ball being contested).
  function toggle(i) {
    if (state.running === i) {
      stopRunning();
    } else {
      stopRunning();
      state.running = i;
      state.startedAt = Date.now();
      now = state.startedAt;
    }
    if (navigator.vibrate) navigator.vibrate(30);
  }

  function reset() {
    if (!confirm('Reset both clocks to 0:00?')) return;
    const names = state.teams.map((t) => ({ name: t.name, color: t.color }));
    const fresh = defaults();
    fresh.teams.forEach((t, i) => Object.assign(t, names[i]));
    state = fresh;
    now = Date.now();
  }

  function format(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
    return `${h > 0 ? h + ':' : ''}${mm}:${String(s).padStart(2, '0')}.${tenths}`;
  }

  // Keep the screen awake while a clock runs (where supported).
  let wakeLock = null;
  async function syncWakeLock() {
    try {
      if (state.running !== null && !wakeLock && 'wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => (wakeLock = null));
      } else if (state.running === null && wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    } catch {
      // not supported or denied
    }
  }
  $effect(() => {
    state.running;
    syncWakeLock();
  });

  onMount(() => {
    let frame;
    const tick = () => {
      now = Date.now();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        now = Date.now();
        wakeLock = null;
        syncWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisible);
    };
  });
</script>

<main>
  <header>
    <div class="bar" aria-label="Possession share">
      <div class="seg" style="width:{pct[0]}%; background:{state.teams[0].color}"></div>
      <div class="seg" style="width:{pct[1]}%; background:{state.teams[1].color}"></div>
    </div>
    <div class="bar-labels">
      <span>{pct[0].toFixed(0)}%</span>
      <span class="status">
        {#if state.running === null}
          Both paused
        {:else}
          {state.teams[state.running].name} in possession
        {/if}
      </span>
      <span>{pct[1].toFixed(0)}%</span>
    </div>
  </header>

  <section class="teams">
    {#each state.teams as team, i}
      <div class="team" class:running={state.running === i} style="--team:{team.color}">
        <div class="team-head">
          <input
            class="color"
            type="color"
            bind:value={team.color}
            aria-label="{team.name} color"
          />
          <input
            class="name"
            type="text"
            bind:value={team.name}
            maxlength="24"
            aria-label="Team {i + 1} name"
          />
        </div>

        <button class="clock" onclick={() => toggle(i)}>
          <span class="time">{format(times[i])}</span>
          <span class="pct">{pct[i].toFixed(1)}% of possession</span>
          <span class="action">{state.running === i ? 'Tap to pause' : 'Tap to start'}</span>
        </button>
      </div>
    {/each}
  </section>

  <footer>
    <button class="secondary" onclick={stopRunning} disabled={state.running === null}>
      Pause both
    </button>
    <span class="total">Tracked: {format(total)}</span>
    <button class="secondary" onclick={reset}>Reset</button>
  </footer>
</main>

<style>
  main {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
    max-width: 1100px;
    margin: 0 auto;
  }

  .bar {
    display: flex;
    height: 14px;
    border-radius: 7px;
    overflow: hidden;
    background: var(--surface);
  }
  .seg {
    transition: width 0.3s linear;
  }
  .bar-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 0.9rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .status {
    text-align: center;
  }

  .teams {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 720px) {
    .teams {
      grid-template-columns: 1fr 1fr;
    }
  }

  .team {
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    transition: border-color 0.15s;
  }
  .team.running {
    border-color: var(--team);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--team) 25%, transparent);
  }

  .team-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
  }
  .color {
    width: 34px;
    height: 34px;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: none;
    cursor: pointer;
    flex-shrink: 0;
  }
  .name {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 1.2rem;
    font-weight: 600;
  }
  .name:hover,
  .name:focus {
    border-color: var(--border);
    outline: none;
  }

  .clock {
    flex: 1;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 20px;
    touch-action: manipulation;
    user-select: none;
  }
  .team.running .clock {
    background: color-mix(in srgb, var(--team) 18%, transparent);
  }
  .clock:active {
    filter: brightness(1.2);
  }
  .time {
    font-size: clamp(3rem, 14vw, 6rem);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .pct {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .action {
    margin-top: 6px;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--team);
  }

  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .total {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .secondary {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 18px;
    cursor: pointer;
  }
  .secondary:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
