// Team names and colors, shared by every tool and saved on this device.

const KEY = 'possession-clock-teams';
const OLD_GAME_KEY = 'possession-clock-v1'; // names used to live in the possession save

const fallback = () => [
  { name: 'Team 1', color: '#2f80ed' },
  { name: 'Team 2', color: '#eb5757' }
];

const valid = (t) =>
  Array.isArray(t) && t.length === 2 && t.every((x) => typeof x?.name === 'string' && typeof x?.color === 'string');

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (valid(saved)) return saved;
    const old = JSON.parse(localStorage.getItem(OLD_GAME_KEY));
    if (valid(old?.teams)) return old.teams.map(({ name, color }) => ({ name, color }));
  } catch {
    // storage unavailable or corrupt
  }
  return fallback();
}

export const teams = $state(load());

$effect.root(() => {
  $effect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(teams));
    } catch {
      // storage unavailable: keep going without saving
    }
  });
});
