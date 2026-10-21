// Saving and loading the game in the browser, so a refresh or a locked
// phone never loses time. Times are stored as timestamps, not counters.

const STORAGE_KEY = 'possession-clock-v1';

export const defaults = () => ({
  teams: [
    { name: 'Team 1', color: '#2f80ed', accumulated: 0, score: 0 },
    { name: 'Team 2', color: '#eb5757', accumulated: 0, score: 0 }
  ],
  running: null, // index of the team whose watch is running, or null
  startedAt: null, // when the running watch last started
  overallStart: null, // when the first team watch was started
  overallEnd: null, // when "Stop exercise" was pressed; null while it's going
  outSince: null, // when the ball went out of play; null while it's in play
  outAccumulated: 0, // finished out-of-play time
  outReason: null, // 'out' (Out of bounds) or 'goal'
  lastScorer: null, // index of the team that scored last
  gameMode: false // show scores and Goal buttons
});

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved.teams) || saved.teams.length !== 2) return defaults();

    // Older saves had no overall timer: start it so no time so far counts as disputed.
    let overallStart = saved.overallStart ?? null;
    const tracked = saved.teams[0].accumulated + saved.teams[1].accumulated;
    if (overallStart === null && (tracked > 0 || saved.running != null)) {
      overallStart = (saved.running != null ? saved.startedAt : Date.now()) - tracked;
    }

    return {
      teams: saved.teams.map((team) => ({ ...team, score: team.score ?? 0 })),
      running: saved.running ?? null,
      startedAt: saved.startedAt ?? null,
      overallStart,
      overallEnd: saved.overallEnd ?? null,
      outSince: saved.outSince ?? null,
      outAccumulated: saved.outAccumulated ?? 0,
      outReason: saved.outReason ?? null,
      lastScorer: saved.lastScorer ?? null,
      gameMode: saved.gameMode ?? false
    };
  } catch {
    return defaults(); // storage unavailable or corrupt
  }
}

export function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable: keep going without saving
  }
}
