<script>
  import { onMount } from 'svelte';
  import Dial from './Dial.svelte';

  const STORAGE_KEY = 'possession-clock-v1';

  const defaults = () => ({
    teams: [
      { name: 'Team 1', color: '#2f80ed', accumulated: 0 },
      { name: 'Team 2', color: '#eb5757', accumulated: 0 }
    ],
    running: null, // index of the team whose clock is running, or null
    startedAt: null, // Date.now() when the running clock last started
    overallStart: null // when the first team watch was started; runs until Reset
  });

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.teams) && saved.teams.length === 2) {
          let overallStart = saved.overallStart ?? null;
          // Older saves had no overall timer: start it so far no time counts as disputed.
          const tracked = saved.teams[0].accumulated + saved.teams[1].accumulated;
          if (overallStart === null && (tracked > 0 || saved.running !== null)) {
            overallStart = (saved.running !== null ? saved.startedAt : Date.now()) - tracked;
          }
          return {
            teams: saved.teams,
            running: saved.running ?? null,
            startedAt: saved.startedAt ?? null,
            overallStart
          };
        }
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
  // Possession split between the two teams (shown on each card)
  let pct = $derived(
    total > 0 ? [(times[0] / total) * 100, (times[1] / total) * 100] : [50, 50]
  );
  // Overall timer: everything since the first watch started. Whatever isn't
  // either team's time is time the ball was in dispute.
  let overall = $derived(state.overallStart ? Math.max(0, now - state.overallStart) : 0);
  let disputed = $derived(Math.max(0, overall - total));
  let share = $derived(
    overall > 0
      ? [(times[0] / overall) * 100, (disputed / overall) * 100, (times[1] / overall) * 100]
      : [0, 0, 0]
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
      if (!state.overallStart) state.overallStart = state.startedAt;
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
    <div class="overall-row">
      <span class="overall">
        <span class="overall-label">Overall</span>
        <span class="overall-time">{format(overall)}</span>
      </span>
      <span class="status" class:dispute={state.overallStart && state.running === null}>
        {#if !state.overallStart}
          Starts with the first watch
        {:else if state.running === null}
          Ball in dispute
        {:else}
          {state.teams[state.running].name} in possession
        {/if}
      </span>
    </div>
    <div class="bar" aria-label="Share of overall time">
      <div class="seg" style="width:{share[0]}%; background:{state.teams[0].color}"></div>
      <div class="seg" style="width:{share[1]}%; background:var(--dispute, #8b95a1)"></div>
      <div class="seg" style="width:{share[2]}%; background:{state.teams[1].color}"></div>
    </div>
    <div class="bar-labels">
      <span>{share[0].toFixed(0)}%</span>
      <span class="dispute-label">
        <span class="dot"></span>In dispute {format(disputed)} · {share[1].toFixed(0)}%
      </span>
      <span>{share[2].toFixed(0)}%</span>
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

        <button class="clock" onclick={() => toggle(i)} aria-pressed={state.running === i}>
          <span class="dial">
            <Dial ms={times[i]} color={team.color} running={state.running === i} label={team.name} />
          </span>
        </button>
        <!-- Second tap target so the text area also toggles; the dial button is the accessible one. -->
        <button class="info" onclick={() => toggle(i)} tabindex="-1" aria-hidden="true">
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
    <button class="secondary" onclick={reset}>Reset</button>
  </footer>
</main>

<style>
  /* The whole app fits one screen: the watches shrink to the space left. */
  main {
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 12px;
    padding-top: max(10px, env(safe-area-inset-top));
    padding-bottom: max(10px, env(safe-area-inset-bottom));
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
  .overall-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 6px;
  }
  .overall {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .overall-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .overall-time {
    font-size: 1.6rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .status {
    font-size: 0.9rem;
    color: var(--muted);
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .status.dispute {
    color: var(--text);
    font-weight: 600;
  }
  .dispute-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--dispute, #8b95a1);
  }

  .teams {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: minmax(0, 1fr);
    gap: 10px;
  }

  /* Each card is a size container so the watch can fill whatever space is left. */
  .team {
    min-width: 0;
    min-height: 0;
    container-type: size;
    display: grid;
    grid-template-areas: 'head' 'dial' 'info';
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    transition: border-color 0.15s, background 0.15s;
  }
  .team.running {
    border-color: var(--team);
    background: color-mix(in srgb, var(--team) 14%, var(--surface));
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--team) 25%, transparent);
  }

  .team-head {
    grid-area: head;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
    min-width: 0;
  }
  .color {
    width: 26px;
    height: 26px;
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
    padding: 4px 6px;
    font-size: 1.05rem;
    font-weight: 600;
  }
  .name:hover,
  .name:focus {
    border-color: var(--border);
    outline: none;
  }

  .clock,
  .info {
    border: none;
    background: transparent;
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
    min-height: 0;
    min-width: 0;
  }
  .clock {
    grid-area: dial;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
  }
  .info {
    grid-area: info;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 0 8px 12px;
  }
  .clock:focus,
  .info:focus {
    outline: none;
  }
  .clock:focus-visible {
    outline: 3px solid var(--team);
    outline-offset: -3px;
    border-radius: 12px;
  }
  .clock:active .dial {
    transform: scale(0.98);
  }
  .dial {
    display: block;
    width: min(100cqw - 20px, 100cqh - 115px, 460px);
    transition: transform 0.08s;
  }
  .pct {
    font-size: 0.85rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .action {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--team);
  }

  /* Phones in portrait: teams stacked, each card with the watch on the left. */
  @media (max-width: 719px) and (orientation: portrait) {
    .teams {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: repeat(2, minmax(0, 1fr));
    }
  }
  /* Phones (portrait or landscape): watch on the left, name and text on the right. */
  @media (max-width: 719px) and (orientation: portrait), (max-height: 500px) {
    .team {
      grid-template-areas: 'dial head' 'dial info';
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
    }
    .team-head {
      border-bottom: none;
      padding: 10px 10px 0 4px;
    }
    .info {
      align-items: flex-start;
      justify-content: center;
      text-align: left;
      padding: 0 10px 0 10px;
    }
    .clock {
      padding: 8px 4px 8px 8px;
    }
    .dial {
      width: min(100cqh - 16px, 60cqw);
    }
  }

  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .secondary {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 9px 14px;
    white-space: nowrap;
    cursor: pointer;
  }
  .secondary:disabled {
    opacity: 0.4;
    cursor: default;
  }
  @media (min-width: 720px) {
    main {
      gap: 16px;
      padding: 16px;
    }
    .teams {
      gap: 16px;
    }
    .name {
      font-size: 1.2rem;
    }
    .pct {
      font-size: 1rem;
    }
  }
</style>
