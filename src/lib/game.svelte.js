// All of the app's timing logic. Components read from a Game and call its actions.
//
// The overall clock runs from the first watch until "Stop exercise". Every
// moment of it is exactly one of:
//   - a team in possession (that team's watch runs)
//   - in dispute (ball in play, nobody has control)
//   - out of play (Out of bounds or after a goal: nobody's clock runs)
// "In play" time is possession + dispute.
import { onMount } from 'svelte';
import { defaults, load, save } from './storage.js';
import { setWakeLock, resetWakeLock } from './wakeLock.js';

class Game {
  state = $state(load());
  now = $state(Date.now()); // ticks every frame so running watches update

  stopped = $derived(this.state.overallEnd !== null);
  started = $derived(this.state.overallStart !== null);
  /** Ball out of play (Out of bounds pressed, or a goal was scored). */
  isOut = $derived(this.state.outSince !== null);

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

  /** Everything since the first watch started, including stoppages. */
  overall = $derived(
    this.started
      ? Math.max(0, (this.state.overallEnd ?? this.now) - this.state.overallStart)
      : 0
  );

  /** Time the ball was out of play (Out of bounds and after goals). */
  outOfPlay = $derived(
    this.state.outAccumulated +
      (this.state.outSince !== null ? Math.max(0, this.now - this.state.outSince) : 0)
  );
  /** Time the ball was live: possession plus dispute. */
  inPlay = $derived(Math.max(0, this.overall - this.outOfPlay));
  disputed = $derived(Math.max(0, this.inPlay - this.total));

  /** [team 1, in dispute, team 2] as shares of the in-play time. */
  share = $derived(
    this.inPlay > 0
      ? [this.times[0], this.disputed, this.times[1]].map((t) => (t / this.inPlay) * 100)
      : [0, 0, 0]
  );

  /** [in play, out of play] as shares of the overall time. */
  playShare = $derived(
    this.overall > 0
      ? [this.inPlay, this.outOfPlay].map((t) => (t / this.overall) * 100)
      : [0, 0]
  );

  inDispute = $derived(
    this.started && !this.stopped && !this.isOut && this.state.running === null
  );

  #pauseRunning(t) {
    const s = this.state;
    if (s.running === null) return;
    s.teams[s.running].accumulated += t - s.startedAt;
    s.running = null;
    s.startedAt = null;
  }

  #endOut(t) {
    const s = this.state;
    if (s.outSince === null) return;
    s.outAccumulated += t - s.outSince;
    s.outSince = null;
    s.outReason = null;
  }

  #startOut(t, reason) {
    const s = this.state;
    this.#pauseRunning(t);
    s.outSince ??= t;
    s.outReason = reason;
  }

  /** Tap a team: pause it if running, otherwise switch possession to it (ends any stoppage). */
  toggle(i) {
    if (this.stopped) return; // exercise is over until Reset
    const s = this.state;
    const t = Date.now();
    if (s.running === i) {
      this.#pauseRunning(t);
    } else {
      this.#pauseRunning(t);
      this.#endOut(t);
      s.running = i;
      s.startedAt = t;
      s.overallStart ??= t;
    }
    this.now = t;
    navigator.vibrate?.(30);
  }

  /** Out of bounds: stop possession time. Press again to put the ball back in play (in dispute). */
  outOfBounds() {
    if (!this.started || this.stopped) return;
    const t = Date.now();
    if (this.isOut) this.#endOut(t);
    else this.#startOut(t, 'out');
    this.now = t;
    navigator.vibrate?.(30);
  }

  /** A team scores: add a goal and stop play until someone takes possession. */
  goal(i) {
    if (!this.started || this.stopped) return;
    const t = Date.now();
    this.state.teams[i].score += 1;
    this.state.lastScorer = i;
    this.#startOut(t, 'goal');
    this.now = t;
    navigator.vibrate?.([40, 60, 40]);
  }

  /** Take back a goal entered by mistake (time is not changed). */
  undoGoal(i) {
    const team = this.state.teams[i];
    if (team.score > 0) team.score -= 1;
  }

  /** Every watch stops; the final numbers stay on screen until Reset. */
  stopExercise() {
    if (!this.started || this.stopped) return;
    const t = Date.now();
    this.#pauseRunning(t);
    this.#endOut(t);
    this.state.overallEnd = t;
    this.now = t;
  }

  /** Clear all times and scores, keeping team names, colors and game mode. */
  reset() {
    const fresh = defaults();
    fresh.teams.forEach((team, i) => {
      team.name = this.state.teams[i].name;
      team.color = this.state.teams[i].color;
    });
    fresh.gameMode = this.state.gameMode;
    this.state = fresh;
    this.now = Date.now();
  }
}

/** Create the game and hook up saving, the frame ticker and the wake lock. Call from a component. */
export function useGame() {
  const game = new Game();
  // The screen stays on for the whole exercise, stoppages included.
  const keepAwake = () => game.started && !game.stopped;

  $effect(() => save(game.state));
  $effect(() => {
    setWakeLock(keepAwake());
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
      resetWakeLock(keepAwake());
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisible);
    };
  });

  return game;
}
