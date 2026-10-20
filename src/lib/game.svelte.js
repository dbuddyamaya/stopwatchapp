// All of the app's timing logic. Components read from a Game and call its actions.
import { onMount } from 'svelte';
import { defaults, load, save } from './storage.js';
import { setWakeLock, resetWakeLock } from './wakeLock.js';

class Game {
  state = $state(load());
  now = $state(Date.now()); // ticks every frame so running watches update

  stopped = $derived(this.state.overallEnd !== null);
  started = $derived(this.state.overallStart !== null);

  /** Each team's possession time. */
  times = $derived(
    this.state.teams.map((team, i) => {
      const live =
        this.state.running === i && this.state.startedAt ? this.now - this.state.startedAt : 0;
      return team.accumulated + Math.max(0, live);
    })
  );
  total = $derived(this.times[0] + this.times[1]);

  /** Possession split between the two teams only (shown on each card). */
  pct = $derived(
    this.total > 0 ? this.times.map((t) => (t / this.total) * 100) : [50, 50]
  );

  /** Everything since the first watch started; whatever isn't team time was in dispute. */
  overall = $derived(
    this.started
      ? Math.max(0, (this.state.overallEnd ?? this.now) - this.state.overallStart)
      : 0
  );
  disputed = $derived(Math.max(0, this.overall - this.total));

  /** [team 1, in dispute, team 2] as shares of the overall time. */
  share = $derived(
    this.overall > 0
      ? [this.times[0], this.disputed, this.times[1]].map((t) => (t / this.overall) * 100)
      : [0, 0, 0]
  );

  inDispute = $derived(this.started && !this.stopped && this.state.running === null);

  status = $derived(
    !this.started
      ? 'Starts with the first watch'
      : this.stopped
        ? 'Exercise stopped'
        : this.state.running === null
          ? 'Ball in dispute'
          : `${this.state.teams[this.state.running].name} in possession`
  );

  #pauseRunning(t = Date.now()) {
    const s = this.state;
    if (s.running === null) return;
    s.teams[s.running].accumulated += t - s.startedAt;
    s.running = null;
    s.startedAt = null;
    this.now = t;
  }

  /** Badge color for the status: green in possession, amber in dispute, gray otherwise. */
  statusColor = $derived(
    !this.started || this.stopped ? 'gray' : this.state.running === null ? 'amber' : 'green'
  );

  /** Tap a team: pause it if running, otherwise switch possession to it. */
  toggle(i) {
    if (this.stopped) return; // exercise is over until Reset
    const s = this.state;
    if (s.running === i) {
      this.#pauseRunning();
    } else {
      const t = Date.now();
      this.#pauseRunning(t);
      s.running = i;
      s.startedAt = t;
      s.overallStart ??= t;
      this.now = t;
    }
    navigator.vibrate?.(30);
  }

  /** Every watch stops; the final numbers stay on screen until Reset. */
  stopExercise() {
    if (!this.started || this.stopped) return;
    const t = Date.now();
    this.#pauseRunning(t);
    this.state.overallEnd = t;
  }

  /** Clear all times, keeping team names and colors. */
  reset() {
    const fresh = defaults();
    fresh.teams.forEach((team, i) => {
      team.name = this.state.teams[i].name;
      team.color = this.state.teams[i].color;
    });
    this.state = fresh;
    this.now = Date.now();
  }
}

/** Create the game and hook up saving, the frame ticker and the wake lock. Call from a component. */
export function useGame() {
  const game = new Game();

  $effect(() => save(game.state));
  $effect(() => {
    setWakeLock(game.state.running !== null);
  });

  onMount(() => {
    let frame;
    const tick = () => {
      game.now = Date.now();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      game.now = Date.now();
      resetWakeLock(game.state.running !== null);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisible);
    };
  });

  return game;
}
