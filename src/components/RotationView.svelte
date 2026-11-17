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
      <span class="heading">Match {s.match} · time's up, no goal</span>
      <span class="question">Who stays on?</span>
      <div class="controls">
        {#each r.fieldTeams as team, i}
          <button class="stay" style="--team:{team.color}; --ink:{inkOn(team.color)}" onclick={() => rotation.stays(i)}>
            {team.name}
          </button>
        {/each}
      </div>
    {:else}
      <span class="heading">Match {s.match}</span>
      <span class="time tabular-nums" class:low={r.running && r.remaining < 30000}>{countdown(r.remaining)}</span>
      {#if s.phase === 'ready'}
        <div class="format">
          <input
            type="number"
            inputmode="numeric"
            min="1"
            max="60"
            value={s.minutes}
            onchange={(e) => rotation.setMinutes(+e.currentTarget.value)}
            aria-label="Minutes per match"
          />
          <span class="x">min or first goal</span>
        </div>
      {:else}
        <span class="sub">{s.minutes} min or first goal</span>
      {/if}
      <div class="controls">
        <Button
          color={r.running ? 'alternative' : 'green'}
          class="flex-1 whitespace-nowrap"
          onclick={() => rotation.primary()}
        >
          {r.action}
        </Button>
        <Button
          color="light"
          class="whitespace-nowrap disabled:opacity-35"
          disabled={!r.sessionStarted}
          onclick={() => (confirmReset = true)}
        >
          New session
        </Button>
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
    </div>
  </section>

  <section class="table" aria-label="Standings">
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
    gap: 10px;
    padding: 10px 12px;
    padding-top: max(10px, env(safe-area-inset-top));
    padding-bottom: max(10px, env(safe-area-inset-bottom));
    max-width: 1100px;
    margin: 0 auto;
  }

  .clock {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 16px;
  }
  .clock.running {
    border-color: #22c55e;
  }
  .clock.decide {
    border-color: #f59e0b;
  }
  .heading {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .question {
    font-size: 1.5rem;
    font-weight: 700;
    padding: 6px 0;
  }
  .time {
    font-size: clamp(3rem, 16vw, 5.5rem);
    line-height: 1;
    font-weight: 700;
  }
  .time.low {
    color: #ef4444;
  }
  .sub,
  .x {
    font-size: 0.85rem;
    color: var(--muted);
  }
  .format {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .format input {
    width: 4rem;
    text-align: center;
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 5px 8px;
  }
  .controls {
    display: flex;
    gap: 8px;
    width: 100%;
    max-width: 420px;
    margin-top: 4px;
  }
  .stay {
    flex: 1;
    min-width: 0;
    padding: 14px 10px;
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
    padding: 8px 12px;
    border-radius: 12px;
    background: color-mix(in srgb, #22c55e 14%, var(--surface));
    border: 1px solid color-mix(in srgb, #22c55e 40%, var(--border));
    font-size: 0.9rem;
  }
  .msg {
    flex: 1;
    min-width: 0;
  }
  .undo-last {
    flex-shrink: 0;
    padding: 6px 12px;
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
    gap: 4px;
    padding: 12px 10px 10px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-top: 6px solid var(--team);
    border-radius: 16px;
  }
  .name {
    max-width: 100%;
    font-size: 1.15rem;
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
    margin-top: 6px;
    padding: 18px 10px;
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
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
    font-size: 0.85rem;
    white-space: nowrap;
    color: var(--muted);
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

  .table {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 4px 10px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }
  th {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    text-align: center;
    padding: 6px 0;
    width: 2.1rem;
  }
  td {
    text-align: center;
    padding: 7px 0;
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
