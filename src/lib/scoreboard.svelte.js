// Scoreboard tool: scores, a goal log and a countdown game clock split into
// halves (or periods). Like the possession clock, times are saved as
// timestamps so a refresh or a locked phone never loses time.
import { onMount } from 'svelte';

const KEY = 'scoreboard-v1';

const defaults = () => ({
  scores: [0, 0],
  goals: [], // { team, period, at } — at = ms into that period
  periods: 2, // 1 = one running clock, 2 = halves, 4 = quarters
  minutes: 20, // length of each period
  period: 1, // current period, 1-based
  phase: 'ready', // ready | running | paused | break (between periods) | final
  startedAt: null, // when the clock last started running
  elapsed: 0 // finished running time in the current period (ms)
});

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.scores) && saved.scores.length === 2) {
      return { ...defaults(), ...saved };
    }
  } catch {
    // storage unavailable or corrupt
  }
  return defaults();
}

const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] ?? 'th');

/** "1st half", "Q3", "Period 2" or "Game". */
export function periodName(p, periods) {
  if (periods === 1) return 'Game';
  if (periods === 2) return `${ordinal(p)} half`;
  if (periods === 4) return `Q${p}`;
  return `Period ${p}`;
}

/** Short tag for the goal list: "H1", "Q3", "P2" or "". */
export function periodTag(p, periods) {
  if (periods === 1) return '';
  return (periods === 2 ? 'H' : periods === 4 ? 'Q' : 'P') + p;
}

class Scoreboard {
  state = $state(load());
  now = $state(Date.now());

  periodMs = $derived(this.state.minutes * 60000);
  running = $derived(this.state.phase === 'running');
  /** True once the first kickoff happened (until Reset). */
  started = $derived(!(this.state.period === 1 && this.state.phase === 'ready'));
  final = $derived(this.state.phase === 'final');

  /** Time played in the current period. */
  elapsed = $derived(
    Math.min(
      this.periodMs,
      this.state.elapsed + (this.running ? Math.max(0, this.now - this.state.startedAt) : 0)
    )
  );
  remaining = $derived(Math.max(0, this.periodMs - this.elapsed));

  periodLabel = $derived(periodName(this.state.period, this.state.periods));

  /** What the main button says. */
  action = $derived.by(() => {
    const s = this.state;
    if (s.phase === 'running') return 'Pause';
    if (s.phase === 'paused') return 'Resume';
    if (s.phase === 'break') return `Start ${periodName(s.period + 1, s.periods)}`;
    if (s.phase === 'final') return 'Full time';
    return 'Start';
  });

  /** Called every frame: ends the period when the countdown reaches 0. */
  tick(t = Date.now()) {
    this.now = t;
    const s = this.state;
    if (s.phase === 'running' && s.elapsed + (t - s.startedAt) >= this.periodMs) {
      s.elapsed = this.periodMs;
      s.startedAt = null;
      s.phase = s.period < s.periods ? 'break' : 'final';
      navigator.vibrate?.([200, 100, 200]);
    }
  }

  /** Main button: start, pause, resume or start the next period. */
  primary() {
    const s = this.state;
    const t = Date.now();
    if (s.phase === 'running') {
      s.elapsed = Math.min(this.periodMs, s.elapsed + (t - s.startedAt));
      s.startedAt = null;
      s.phase = 'paused';
    } else if (s.phase === 'ready' || s.phase === 'paused' || s.phase === 'break') {
      if (s.phase === 'break') {
        s.period += 1;
        s.elapsed = 0;
      }
      s.startedAt = t;
      s.phase = 'running';
    } else {
      return; // final
    }
    this.now = t;
    navigator.vibrate?.(30);
  }

  goal(i) {
    if (!this.started) return;
    this.state.scores[i] += 1;
    this.state.goals.push({ team: i, period: this.state.period, at: this.elapsed });
    navigator.vibrate?.([40, 60, 40]);
  }

  /** Take back the latest goal of team i (entered by mistake). */
  undoGoal(i) {
    const s = this.state;
    if (s.scores[i] === 0) return;
    s.scores[i] -= 1;
    const last = s.goals.findLastIndex((g) => g.team === i);
    if (last !== -1) s.goals.splice(last, 1);
  }

  /** Game settings can change only before kickoff. */
  setFormat(periods, minutes) {
    if (this.started) return;
    this.state.periods = periods;
    this.state.minutes = Math.min(120, Math.max(1, Math.round(minutes) || 1));
  }

  /** Back to 0-0 and a full clock, keeping the game format. */
  reset() {
    const fresh = defaults();
    fresh.periods = this.state.periods;
    fresh.minutes = this.state.minutes;
    this.state = fresh;
    this.now = Date.now();
  }
}

/** Create the scoreboard and hook up saving and the frame ticker. Call from a component. */
export function useScoreboard() {
  const board = new Scoreboard();

  $effect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(board.state));
    } catch {
      // storage unavailable: keep going without saving
    }
  });

  onMount(() => {
    let frame;
    const tick = () => {
      board.tick();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });

  return board;
}
