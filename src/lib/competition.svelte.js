// Competition tool: players take turns against the clock (e.g. 45 seconds),
// the coach taps point buttons during the turn, and a table adds up the
// points for every round. Rounds can have a name ("Two touch", "One touch")
// that is shown during each turn. Saved as timestamps like the other tools.
import { onMount } from 'svelte';

const KEY = 'competition-v1';
export const MAX_PLAYERS = 30;

const defaults = () => ({
  players: [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' },
    { id: 3, name: 'Player 3' }
  ],
  nextId: 4,
  turnSec: 45,
  buttons: [1, 3, -1], // point buttons shown during a turn
  rounds: [{ name: '' }, { name: '' }], // one entry per round; name is optional
  phase: 'setup', // setup | ready | running | paused | done | final
  round: 0, // current round (index)
  turn: 0, // position in this round's order
  order: [], // player ids for the current round
  scores: {}, // round index -> { player id -> points }
  log: [], // { round, player, value } — for undoing the last point
  startedAt: null,
  elapsed: 0
});

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.players) && Array.isArray(saved.rounds)) return { ...defaults(), ...saved };
  } catch {
    // storage unavailable or corrupt
  }
  return defaults();
}

class Competition {
  state = $state(load());
  now = $state(Date.now());

  turnMs = $derived(this.state.turnSec * 1000);
  running = $derived(this.state.phase === 'running');
  inTurn = $derived(this.state.phase === 'running' || this.state.phase === 'paused');
  started = $derived(this.state.phase !== 'setup');

  elapsed = $derived(
    Math.min(this.turnMs, this.state.elapsed + (this.running ? Math.max(0, this.now - this.state.startedAt) : 0))
  );
  remaining = $derived(Math.max(0, this.turnMs - this.elapsed));

  byId = $derived(Object.fromEntries(this.state.players.map((p) => [p.id, p])));
  roundCount = $derived(this.state.rounds.length);
  roundName = $derived(this.state.rounds[this.state.round]?.name?.trim() ?? '');

  /** The player whose turn it is (or just finished, in the "done" phase). */
  current = $derived(this.byId[this.state.order[this.state.turn]] ?? null);
  currentPoints = $derived(
    this.current ? (this.state.scores[this.state.round]?.[this.current.id] ?? 0) : 0
  );

  /** Who goes after the current turn: { player, round } or null at the very end. */
  next = $derived.by(() => {
    const s = this.state;
    for (let t = s.turn + 1; t < s.order.length; t++) {
      if (this.byId[s.order[t]]) return { player: this.byId[s.order[t]], round: s.round };
    }
    if (s.round + 1 < s.rounds.length && s.players.length) return { player: s.players[0], round: s.round + 1 };
    return null;
  });

  /** Players with points per round and total, best first. */
  table = $derived(
    this.state.players
      .map((p) => {
        const perRound = this.state.rounds.map((_, r) => this.state.scores[r]?.[p.id] ?? null);
        const total = perRound.reduce((a, b) => a + (b ?? 0), 0);
        return { ...p, perRound, total };
      })
      .sort((a, b) => b.total - a.total)
  );

  /** Called every frame: ends the turn when the clock reaches 0. */
  tick(t = Date.now()) {
    this.now = t;
    const s = this.state;
    if (s.phase === 'running' && s.elapsed + (t - s.startedAt) >= this.turnMs) {
      s.elapsed = this.turnMs;
      s.startedAt = null;
      s.phase = 'done';
      navigator.vibrate?.([200, 100, 200]);
    }
  }

  /** Setup finished: first player of round 1 gets ready. */
  begin() {
    const s = this.state;
    if (s.phase !== 'setup' || s.players.length === 0 || s.rounds.length === 0) return;
    s.round = 0;
    s.turn = 0;
    s.order = s.players.map((p) => p.id);
    s.scores = {};
    s.log = [];
    s.elapsed = 0;
    s.phase = 'ready';
  }

  /** Main button: start / pause / resume this turn, or start the next player's turn. */
  primary() {
    const s = this.state;
    const t = Date.now();
    if (s.phase === 'running') {
      s.elapsed = Math.min(this.turnMs, s.elapsed + (t - s.startedAt));
      s.startedAt = null;
      s.phase = 'paused';
    } else if (s.phase === 'paused' || s.phase === 'ready') {
      s.startedAt = t;
      s.phase = 'running';
    } else if (s.phase === 'done') {
      if (!this.#advance()) return;
      s.startedAt = t;
      s.phase = 'running';
    } else {
      return;
    }
    this.now = t;
    navigator.vibrate?.(30);
  }

  /** Move to the next player (and next round when needed). False at the very end. */
  #advance() {
    const s = this.state;
    for (let t = s.turn + 1; t < s.order.length; t++) {
      if (this.byId[s.order[t]]) {
        s.turn = t;
        s.elapsed = 0;
        return true;
      }
    }
    if (s.round + 1 < s.rounds.length && s.players.length) {
      s.round += 1;
      s.order = s.players.map((p) => p.id);
      s.turn = 0;
      s.elapsed = 0;
      return true;
    }
    return false;
  }

  /** Skip a player without a turn (not here, injured...): the player who is
   *  ready to start, or — right after a turn — the one who's up next. */
  skip() {
    const s = this.state;
    if (s.phase === 'done' && !this.#advance()) return; // nobody left to skip
    if (s.phase !== 'ready' && s.phase !== 'done') return;
    s.phase = this.#advance() ? 'ready' : 'final';
  }

  /** Stop the clock now and finish this turn. */
  endTurn() {
    if (!this.inTurn) return;
    const s = this.state;
    s.elapsed = this.turnMs;
    s.startedAt = null;
    s.phase = 'done';
  }

  /** Add (or take away) points for the current player. Works during the turn
   *  and right after it ends, for a last pass at the buzzer. */
  score(value) {
    const s = this.state;
    if (!(this.inTurn || s.phase === 'done') || !this.current) return;
    const id = this.current.id;
    if (!s.scores[s.round]) s.scores[s.round] = {};
    s.scores[s.round][id] = (s.scores[s.round][id] ?? 0) + value;
    s.log.push({ round: s.round, player: id, value });
    navigator.vibrate?.(20);
  }

  /** Take back the last point tapped for the current player. */
  undoPoint() {
    const s = this.state;
    if (!this.current) return;
    const i = s.log.findLastIndex((l) => l.round === s.round && l.player === this.current.id);
    if (i === -1) return;
    const [l] = s.log.splice(i, 1);
    s.scores[l.round][l.player] -= l.value;
  }

  canUndo = $derived(
    !!this.current &&
      this.state.log.some((l) => l.round === this.state.round && l.player === this.current.id)
  );

  /** After the planned rounds: one more round (if there's time). */
  addRound() {
    const s = this.state;
    s.rounds.push({ name: '' });
    if (s.phase === 'final' || (s.phase === 'done' && !this.next)) {
      s.round = s.rounds.length - 1;
      s.order = s.players.map((p) => p.id);
      s.turn = 0;
      s.elapsed = 0;
      s.phase = 'ready';
    }
  }

  finish() {
    if (this.state.phase === 'done' && !this.next) this.state.phase = 'final';
  }

  // ----- Settings -----

  addPlayer() {
    const s = this.state;
    if (s.players.length >= MAX_PLAYERS) return;
    const id = s.nextId++;
    s.players.push({ id, name: `Player ${id}` });
    // Joins the current round too if their turn would still be ahead
    if (this.started && s.phase !== 'final') s.order.push(id);
  }

  canRemove(id) {
    return this.state.players.length > 1 && !(this.started && this.current?.id === id && this.state.phase !== 'final');
  }

  removePlayer(id) {
    if (!this.canRemove(id)) return;
    const s = this.state;
    s.players = s.players.filter((p) => p.id !== id);
    // keep `turn` pointing at the same player
    const idx = s.order.indexOf(id);
    if (idx !== -1) {
      s.order.splice(idx, 1);
      if (idx < s.turn) s.turn -= 1;
    }
    for (const r of Object.keys(s.scores)) delete s.scores[r][id];
    s.log = s.log.filter((l) => l.player !== id);
  }

  movePlayer(index, dir) {
    const p = this.state.players;
    const j = index + dir;
    if (j < 0 || j >= p.length) return;
    [p[index], p[j]] = [p[j], p[index]];
  }

  /** Turn length can change between turns. */
  setTurn(min, sec) {
    if (this.inTurn) return;
    const total = Math.round((+min || 0) * 60 + (+sec || 0));
    this.state.turnSec = Math.min(3600, Math.max(5, total));
  }

  setButtons(values) {
    const clean = values.map((v) => Math.round(+v)).filter((v) => Number.isFinite(v) && v !== 0);
    if (clean.length) this.state.buttons = clean.slice(0, 6);
  }

  setRoundCount(n) {
    const s = this.state;
    const min = this.started ? s.round + 1 : 1;
    n = Math.min(20, Math.max(min, Math.round(+n) || 1));
    while (s.rounds.length < n) s.rounds.push({ name: '' });
    while (s.rounds.length > n) {
      delete s.scores[s.rounds.length - 1];
      s.rounds.pop();
    }
  }

  /** Same players and settings, scores cleared, back to the setup screen. */
  reset() {
    const s = this.state;
    Object.assign(s, {
      phase: 'setup',
      round: 0,
      turn: 0,
      order: [],
      scores: {},
      log: [],
      startedAt: null,
      elapsed: 0
    });
    this.now = Date.now();
  }
}

export function useCompetition() {
  const comp = new Competition();

  $effect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(comp.state));
    } catch {
      // storage unavailable: keep going without saving
    }
  });

  onMount(() => {
    let frame;
    const tick = () => {
      comp.tick();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });

  return comp;
}
