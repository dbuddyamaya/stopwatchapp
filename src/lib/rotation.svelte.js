// "Winner stays" tool: several teams take turns, two on the field at a time.
// A match lasts a set number of minutes or until the first goal:
//   - goal: the scorer stays, the other team goes to the back of the line
//   - time up, no goal: the team that has been on more matches in a row
//     leaves; if both have been on equally long, you pick who stays
// The next team in line takes the leaving team's place.
// Saved as timestamps, like the other tools, so refreshes never lose time.
import { onMount } from 'svelte';
import { teams as sharedTeams } from './teams.svelte.js';

const KEY = 'rotation-v1';
const COLORS = ['#2f80ed', '#eb5757', '#27ae60', '#f2c94c', '#9b51e0', '#f2994a', '#56ccf2', '#ff6fb5'];
export const MIN_TEAMS = 3;
export const MAX_TEAMS = 8;

function startingTeams() {
  return [
    { id: 1, name: sharedTeams[0].name, color: sharedTeams[0].color },
    { id: 2, name: sharedTeams[1].name, color: sharedTeams[1].color },
    { id: 3, name: 'Team 3', color: COLORS[2] }
  ];
}

/** A fresh session for these teams: first two on the field, the rest in line. */
function freshSession(teams, minutes = 5) {
  const ids = teams.map((t) => t.id);
  return {
    teams,
    minutes,
    field: [ids[0], ids[1]],
    queue: ids.slice(2),
    onCount: {}, // matches in a row each field team has played
    stats: {}, // id -> { w, d, l, gf, ga }
    match: 1,
    phase: 'ready', // ready | running | paused | decide (time up, tied: pick who stays)
    startedAt: null,
    elapsed: 0,
    last: null, // result of the previous match, for the banner
    undo: null, // snapshot from before the previous match ended
    nextId: Math.max(...ids) + 1
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.teams) && saved.teams.length >= MIN_TEAMS && Array.isArray(saved.field)) {
      return saved;
    }
  } catch {
    // storage unavailable or corrupt
  }
  return freshSession(startingTeams());
}

const blankStats = () => ({ w: 0, d: 0, l: 0, gf: 0, ga: 0 });

class Rotation {
  state = $state(load());
  now = $state(Date.now());

  matchMs = $derived(this.state.minutes * 60000);
  running = $derived(this.state.phase === 'running');
  /** Any match played or under way (team order and removal lock once true). */
  sessionStarted = $derived(this.state.match > 1 || this.state.phase !== 'ready');
  /** Ball can be scored: the match has kicked off. */
  inMatch = $derived(this.state.phase === 'running' || this.state.phase === 'paused');

  elapsed = $derived(
    Math.min(
      this.matchMs,
      this.state.elapsed + (this.running ? Math.max(0, this.now - this.state.startedAt) : 0)
    )
  );
  remaining = $derived(Math.max(0, this.matchMs - this.elapsed));

  byId = $derived(Object.fromEntries(this.state.teams.map((t) => [t.id, t])));
  fieldTeams = $derived(this.state.field.map((id) => this.byId[id]));
  queueTeams = $derived(this.state.queue.map((id) => this.byId[id]));

  /** Every team, best first: wins, then goal difference, then goals scored. */
  standings = $derived(
    this.state.teams
      .map((t) => ({ ...t, ...blankStats(), ...this.state.stats[t.id] }))
      .map((r) => ({ ...r, played: r.w + r.d + r.l, gd: r.gf - r.ga }))
      .sort((a, b) => b.w - a.w || b.gd - a.gd || b.gf - a.gf || b.d - a.d)
  );

  action = $derived(
    this.state.phase === 'running' ? 'Pause' : this.state.phase === 'paused' ? 'Resume' : 'Start match'
  );

  /** A team's stats entry, created on first use (read back through the state so changes are saved). */
  #stat(id) {
    if (!this.state.stats[id]) this.state.stats[id] = blankStats();
    return this.state.stats[id];
  }

  #snapshot() {
    const s = this.state;
    return JSON.parse(
      JSON.stringify({
        field: s.field,
        queue: s.queue,
        onCount: s.onCount,
        stats: s.stats,
        match: s.match,
        last: s.last,
        elapsed: this.elapsed
      })
    );
  }

  /** Swap out the leaving field team for the next in line and get the next match ready. */
  #rotate(leaveIdx, result) {
    const s = this.state;
    for (const id of s.field) s.onCount[id] = (s.onCount[id] ?? 0) + 1;
    const leaver = s.field[leaveIdx];
    const incoming = s.queue.shift();
    s.queue.push(leaver);
    s.onCount[leaver] = 0;
    s.onCount[incoming] = 0;
    s.field[leaveIdx] = incoming;
    s.last = { ...result, match: s.match, leaver, incoming };
    s.match += 1;
    s.phase = 'ready';
    s.startedAt = null;
    s.elapsed = 0;
  }

  /** Called every frame: handles the clock running out. */
  tick(t = Date.now()) {
    this.now = t;
    const s = this.state;
    if (s.phase !== 'running' || s.elapsed + (t - s.startedAt) < this.matchMs) return;

    s.elapsed = this.matchMs;
    s.startedAt = null;
    navigator.vibrate?.([200, 100, 200]);
    const [a, b] = s.field.map((id) => s.onCount[id] ?? 0);
    if (a === b) {
      s.phase = 'decide';
    } else {
      this.#draw(a > b ? 0 : 1);
    }
  }

  #draw(leaveIdx) {
    const s = this.state;
    s.undo = { ...this.#snapshot(), endedBy: 'time' };
    for (const id of s.field) this.#stat(id).d += 1;
    this.#rotate(leaveIdx, { type: 'draw', stayer: s.field[1 - leaveIdx] });
  }

  /** Time ran out with both teams on equally long: team i stays. */
  stays(i) {
    if (this.state.phase !== 'decide') return;
    this.#draw(1 - i);
  }

  /** Start, pause or resume the match clock. */
  primary() {
    const s = this.state;
    const t = Date.now();
    if (s.phase === 'running') {
      s.elapsed = Math.min(this.matchMs, s.elapsed + (t - s.startedAt));
      s.startedAt = null;
      s.phase = 'paused';
    } else if (s.phase === 'ready' || s.phase === 'paused') {
      if (s.phase === 'ready') s.undo = null; // a new match locks in the last result
      s.startedAt = t;
      s.phase = 'running';
    } else {
      return;
    }
    this.now = t;
    navigator.vibrate?.(30);
  }

  /** Team i (0 = left, 1 = right) scores: it wins and stays. */
  goal(i) {
    if (!this.inMatch) return;
    const s = this.state;
    s.undo = { ...this.#snapshot(), endedBy: 'goal' };
    const [winner, loser] = [s.field[i], s.field[1 - i]];
    const ws = this.#stat(winner);
    const ls = this.#stat(loser);
    ws.w += 1;
    ws.gf += 1;
    ls.l += 1;
    ls.ga += 1;
    navigator.vibrate?.([40, 60, 40]);
    this.#rotate(1 - i, { type: 'win', winner, loser });
  }

  /** Take back the last result (a mis-tapped goal or the wrong team picked to stay). */
  undoLast() {
    const s = this.state;
    const u = s.undo;
    if (!u || s.phase !== 'ready') return;
    Object.assign(s, {
      field: u.field,
      queue: u.queue,
      onCount: u.onCount,
      stats: u.stats,
      match: u.match,
      last: u.last,
      startedAt: null,
      undo: null
    });
    // A goal comes back as a paused match at the time it was scored;
    // a timed-out match comes back to the "who stays?" question.
    if (u.endedBy === 'goal') {
      s.elapsed = u.elapsed;
      s.phase = 'paused';
    } else {
      s.elapsed = this.matchMs;
      s.phase = 'decide';
    }
  }

  setMinutes(m) {
    if (this.inMatch || this.state.phase === 'decide') return;
    this.state.minutes = Math.min(60, Math.max(1, Math.round(m) || 1));
  }

  /** New teams join the back of the line (any time). */
  addTeam() {
    const s = this.state;
    if (s.teams.length >= MAX_TEAMS) return;
    const id = s.nextId++;
    const used = new Set(s.teams.map((t) => t.color));
    s.teams.push({ id, name: `Team ${id}`, color: COLORS.find((c) => !used.has(c)) ?? COLORS[id % COLORS.length] });
    s.queue.push(id);
  }

  /** A team can leave if it's not on the field and at least 3 would remain. */
  canRemove(id) {
    return this.state.teams.length > MIN_TEAMS && !this.state.field.includes(id);
  }

  removeTeam(id) {
    if (!this.canRemove(id)) return;
    const s = this.state;
    s.teams = s.teams.filter((t) => t.id !== id);
    s.queue = s.queue.filter((q) => q !== id);
    delete s.stats[id];
    delete s.onCount[id];
    s.undo = null;
  }

  /** Before the first match: move a team earlier in the starting order. */
  moveUp(index) {
    if (this.sessionStarted || index <= 0) return;
    const s = this.state;
    const t = [...s.teams];
    [t[index - 1], t[index]] = [t[index], t[index - 1]];
    Object.assign(s, freshSession(t, s.minutes));
  }

  /** New session: standings cleared, starting order from the team list. Teams and minutes kept. */
  reset() {
    this.state = freshSession(this.state.teams, this.state.minutes);
    this.now = Date.now();
  }
}

export function useRotation() {
  const rotation = new Rotation();

  $effect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(rotation.state));
    } catch {
      // storage unavailable: keep going without saving
    }
  });

  onMount(() => {
    let frame;
    const tick = () => {
      rotation.tick();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });

  return rotation;
}
