<script>
  // "Winner stays" tool: match clock, the two teams on the field with a Goal
  // button each, who's next in line, and the standings.
  import Button from 'flowbite-svelte/Button.svelte';
  import { MAX_TEAMS } from '../lib/rotation.svelte.js';
  import { inkOn } from '../lib/color.js';
  import MenuButton from './MenuButton.svelte';
  import ThemeButton from './ThemeButton.svelte';
  import IconButton from './IconButton.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import TeamsEditor from './TeamsEditor.svelte';

  let { rotation, onmenu } = $props();
  let confirmReset = $state(false);
  let editing = $state(false);

  let s = $derived(rotation.state);
  let r = $derived(rotation);

  const pad = (n) => String(n).padStart(2, '0');
  const countdown = (ms) => {
    const sec = Math.ceil(ms / 1000);
    return `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
  };

  /** "3 in a row" for a team that has stayed on, "New" for one that just came on. */
  const streakText = (id) => {
    const n = s.onCount[id] ?? 0;
    return n === 0 ? (s.match === 1 ? 'First match' : 'Just came on') : `${n} ${n === 1 ? 'match' : 'matches'} in a row`;
  };

  let banner = $derived.by(() => {
    const l = s.last;
    if (!l || s.phase !== 'ready') return null;
    const name = (id) => r.byId[id]?.name ?? 'A team';
    const head =
      l.type === 'win' ? `${name(l.winner)} beat ${name(l.loser)}` : `No goal: ${name(l.stayer)} stays`;
    return `${head} · ${name(l.incoming)} comes on`;
  });
</script>

<main>
  <header class="flex items-center justify-between gap-3">
    <div class="flex min-w-0 items-center gap-2.5">
      <MenuButton onclick={onmenu} />
      <span class="truncate text-lg font-semibold">Winner stays</span>
    </div>
    <div class="flex items-center gap-2">
      <IconButton label="Edit teams" onclick={() => (editing = true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
          <circle cx="17" cy="9" r="2.5" /><path d="M16 14.2c2.4-.3 4.1 1.3 4.6 4.3" />
        </svg>
      </IconButton>
      <ThemeButton />
    </div>
  </header>

  <section class="clock" class:running={r.running} class:decide={s.phase === 'decide'}>
    {#if s.phase === 'decide'}
      <div class="ask">
        <span class="q">Who stays on?</span>
        <span class="heading">Match {s.match} · no goal</span>
      </div>
      <div class="stays">
        {#each r.fieldTeams as team, i}
          <button class="stay" style="--team:{team.color}; --ink:{inkOn(team.color)}" onclick={() => rotation.stays(i)}>
            {team.name}
          </button>
        {/each}
      </div>
    {:else}
      <div class="readout">
        <span class="heading">Match {s.match}</span>
        <span class="time tabular-nums" class:low={r.running && r.remaining < 30000}>{countdown(r.remaining)}</span>
      </div>
      <div class="side">
        <Button
          color={r.running ? 'alternative' : 'green'}
          class="w-full whitespace-nowrap"
          onclick={() => rotation.primary()}
        >
          {r.action}
        </Button>
        <div class="meta">
          {#if s.phase === 'ready'}
            <label class="format">
              <input
                type="number"
                inputmode="numeric"
                min="1"
                max="60"
                value={s.minutes}
                onchange={(e) => rotation.setMinutes(+e.currentTarget.value)}
                aria-label="Minutes per match"
              />
              <span>min or goal</span>
            </label>
          {:else}
            <span class="sub">{s.minutes} min or goal</span>
          {/if}
          <button
            class="link"
            disabled={!r.sessionStarted}
            onclick={() => (confirmReset = true)}
          >
            New session
          </button>
        </div>
      </div>
    {/if}
  </section>

  {#if banner}
    <div class="banner" role="status">
      <span class="msg">{banner}</span>
      {#if s.undo}
        <button class="undo-last" onclick={() => rotation.undoLast()}>Undo</button>
      {/if}
    </div>
  {/if}

  <section class="field">
    {#each r.fieldTeams as team, i (team.id)}
      <div class="team" style="--team:{team.color}; --ink:{inkOn(team.color)}">
        <span class="name">{team.name}</span>
        <span class="streak">{streakText(team.id)}</span>
        <button class="goal" onclick={() => rotation.goal(i)} disabled={!r.inMatch}>Goal</button>
      </div>
    {/each}
  </section>

  <section class="next" aria-label="Next in line">
    <span class="label">Next</span>
    <div class="chips">
      {#each r.queueTeams as team, i (team.id)}
        <span class="chip" class:first={i === 0}>
          <span class="dot" style="background:{team.color}"></span>{team.name}
        </span>
      {/each}
      {#if s.teams.length < MAX_TEAMS}
        <button class="chip add" onclick={() => { rotation.addTeam(); editing = true; }}>+ Add team</button>
      {/if}
    </div>
  </section>

  <section class="standings" aria-label="Standings">
    <table>
      <thead>
        <tr><th class="t">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th></tr>
      </thead>
      <tbody>
        {#each r.standings as row, i (row.id)}
          <tr class:onfield={s.field.includes(row.id)}>
            <td class="t">
              <div class="tcell">
                <span class="pos">{i + 1}</span>
                <span class="dot" style="background:{row.color}"></span>
                <span class="tn">{row.name}</span>
              </div>
            </td>
            <td>{row.played}</td>
            <td class="w">{row.w}</td>
            <td>{row.d}</td>
            <td>{row.l}</td>
            <td>{row.gf}</td>
            <td>{row.ga}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
</main>

<TeamsEditor bind:open={editing} {rotation} max={MAX_TEAMS} />

<ConfirmDialog
  bind:open={confirmReset}
  title="Start a new session?"
  message="Standings are cleared and the line goes back to the team list order. Teams and match length are kept."
  confirmLabel="New session"
  onconfirm={() => rotation.reset()}
/>

<style>
  main {
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    padding-top: max(10px, env(safe-area-inset-top));
    padding-bottom: max(10px, env(safe-area-inset-bottom));
    max-width: 1100px;
    margin: 0 auto;
  }

  .clock {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 6px 16px;
    padding: 10px 12px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 16px;
  }
  .clock.running {
    border-color: #22c55e;
  }
  .clock.decide {
    grid-template-columns: minmax(0, 1fr);
    border-color: #f59e0b;
  }
  .readout {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .heading {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .time {
    font-size: clamp(2.6rem, 13vw, 3.6rem);
    line-height: 1;
    font-weight: 700;
  }
  .time.low {
    color: #ef4444;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    font-size: 0.8rem;
    color: var(--muted);
    white-space: nowrap;
  }
  .format {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .format input {
    width: 2.9rem;
    text-align: center;
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 2px 4px;
    font-size: 0.85rem;
  }
  .link {
    background: none;
    border: none;
    padding: 2px 0;
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 3px;
    font-size: 0.8rem;
    cursor: pointer;
  }
  .link:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .ask {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  .q {
    font-size: 1.1rem;
    font-weight: 700;
  }
  .stays {
    display: flex;
    gap: 8px;
  }
  .stay {
    flex: 1;
    min-width: 0;
    padding: 12px 10px;
    border-radius: 12px;
    font-weight: 700;
    background: var(--team);
    color: var(--ink, #fff);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  .banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 6px 5px 12px;
    border-radius: 12px;
    background: color-mix(in srgb, #22c55e 14%, var(--surface));
    border: 1px solid color-mix(in srgb, #22c55e 40%, var(--border));
    font-size: 0.82rem;
    line-height: 1.25;
  }
  .msg {
    flex: 1;
    min-width: 0;
  }
  .undo-last {
    flex-shrink: 0;
    padding: 4px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-weight: 600;
    cursor: pointer;
  }

  .field {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    flex-shrink: 0;
  }
  .team {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 8px 8px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-top: 6px solid var(--team);
    border-radius: 16px;
  }
  .name {
    max-width: 100%;
    font-size: 1.05rem;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .streak {
    font-size: 0.78rem;
    color: var(--muted);
  }
  .goal {
    width: 100%;
    margin-top: 4px;
    padding: 14px 10px;
    border-radius: 12px;
    font-size: 1.15rem;
    font-weight: 700;
    background: var(--team);
    color: var(--ink, #fff);
    touch-action: manipulation;
    user-select: none;
    cursor: pointer;
  }
  .goal:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .goal:not(:disabled):active {
    transform: scale(0.97);
  }

  .next {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    flex-shrink: 0;
  }
  .chips {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    min-width: 0;
    scrollbar-width: none;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
    font-size: 0.85rem;
    white-space: nowrap;
    color: var(--muted);
  }
  .chip.add {
    border-style: dashed;
    color: var(--text);
    cursor: pointer;
  }
  .chip.first {
    color: var(--text);
    font-weight: 600;
    border-color: var(--muted);
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .standings {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2px 10px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
  }
  th {
    position: sticky;
    top: 0;
    background: var(--surface);
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    text-align: center;
    padding: 4px 0;
    width: 2rem;
  }
  td {
    text-align: center;
    padding: 4px 0;
    border-top: 1px solid var(--border);
  }
  th.t,
  td.t {
    text-align: left;
    width: auto;
  }
  .tcell {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }
  .pos {
    width: 1rem;
    color: var(--muted);
    font-size: 0.8rem;
  }
  .tn {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 9.5rem;
  }
  tr.onfield .tn {
    font-weight: 700;
  }
  td.w {
    font-weight: 700;
  }

  @media (min-width: 720px) {
    main {
      gap: 16px;
      padding: 16px;
    }
  }
</style>
