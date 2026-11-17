<script>
  // Scoreboard tool: countdown clock with halves/periods, a big score and
  // Goal button per team, and the list of goals.
  import Button from 'flowbite-svelte/Button.svelte';
  import Input from 'flowbite-svelte/Input.svelte';
  import { teams } from '../lib/teams.svelte.js';
  import { inkOn } from '../lib/color.js';
  import { periodName, periodTag } from '../lib/scoreboard.svelte.js';
  import MenuButton from './MenuButton.svelte';
  import ThemeButton from './ThemeButton.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';

  let { board, onmenu } = $props();
  let confirmReset = $state(false);

  const FORMATS = [
    { periods: 1, label: 'One period' },
    { periods: 2, label: 'Halves' },
    { periods: 3, label: 'Thirds' },
    { periods: 4, label: 'Quarters' }
  ];

  const pad = (n) => String(n).padStart(2, '0');
  /** Countdown "m:ss", rounding up so it starts at 20:00 and ends at 0:00. */
  const countdown = (ms) => {
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${pad(s % 60)}`;
  };
  /** Time into the period, "m:ss". */
  const clockTime = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${pad(s % 60)}`;
  };

  let s = $derived(board.state);

  let heading = $derived(
    s.phase === 'final'
      ? 'Full time'
      : s.phase === 'break'
        ? s.periods === 2
          ? 'Half-time'
          : `End of ${periodName(s.period, s.periods)}`
        : board.periodLabel
  );

  /** Goals newest first, with the score right after each one. */
  let log = $derived.by(() => {
    const score = [0, 0];
    return s.goals
      .map((g) => {
        score[g.team] += 1;
        return { ...g, score: `${score[0]}–${score[1]}` };
      })
      .reverse();
  });
</script>

<main>
  <header class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2.5">
      <MenuButton onclick={onmenu} />
      <span class="text-lg font-semibold">Scoreboard</span>
    </div>
    <ThemeButton />
  </header>

  <section class="clock" class:running={board.running} class:final={board.final}>
    <span class="heading">{heading}</span>
    <span class="time tabular-nums" class:low={board.running && board.remaining < 60000}>
      {countdown(board.remaining)}
    </span>

    {#if !board.started}
      <div class="format">
        <select
          value={s.periods}
          onchange={(e) => board.setFormat(+e.currentTarget.value, s.minutes)}
          aria-label="Game format"
        >
          {#each FORMATS as f}
            <option value={f.periods}>{f.label}</option>
          {/each}
        </select>
        <span class="x">of</span>
        <input
          type="number"
          inputmode="numeric"
          min="1"
          max="120"
          value={s.minutes}
          onchange={(e) => board.setFormat(s.periods, +e.currentTarget.value)}
          aria-label="Minutes per period"
        />
        <span class="x">min</span>
      </div>
    {:else}
      <span class="sub">
        {s.periods === 1 ? `${s.minutes} min` : `${s.periods} × ${s.minutes} min`}
      </span>
    {/if}

    <div class="controls">
      <Button
        color={board.running ? 'alternative' : 'green'}
        class="flex-1 whitespace-nowrap disabled:opacity-35"
        disabled={board.final}
        onclick={() => board.primary()}
      >
        {board.action}
      </Button>
      <Button color="light" class="whitespace-nowrap disabled:opacity-35" disabled={!board.started} onclick={() => (confirmReset = true)}>
        Reset
      </Button>
    </div>
  </section>

  <section class="teams">
    {#each teams as team, i}
      <div class="team" style="--team:{team.color}; --ink:{inkOn(team.color)}">
        <div class="head">
          <input class="color" type="color" bind:value={team.color} aria-label="{team.name} color" />
          <div class="min-w-0 flex-1">
            <Input size="sm" bind:value={team.name} maxlength={24} aria-label="Team {i + 1} name" class="font-semibold" />
          </div>
        </div>
        <span class="score tabular-nums" aria-label="{team.name} score">{s.scores[i]}</span>
        <div class="goal-row">
          <button class="goal" onclick={() => board.goal(i)} disabled={!board.started}>Goal</button>
          <button
            class="undo"
            onclick={() => board.undoGoal(i)}
            disabled={s.scores[i] === 0}
            aria-label="Remove a goal from {team.name}"
            title="Remove a goal">−1</button
          >
        </div>
      </div>
    {/each}
  </section>

  <section class="log" aria-label="Goals">
    {#if log.length === 0}
      <p class="empty">{board.started ? 'No goals yet' : 'Press Start to kick off'}</p>
    {:else}
      <ul>
        {#each log as g}
          <li>
            <span class="dot" style="background:{teams[g.team].color}"></span>
            <span class="who">{teams[g.team].name}</span>
            <span class="when tabular-nums">{periodTag(g.period, s.periods)} {clockTime(g.at)}</span>
            <span class="sc tabular-nums">{g.score}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>

<ConfirmDialog
  bind:open={confirmReset}
  title="Reset the scoreboard?"
  message="Scores, goals and the clock go back to the start. Team names, colors and the game format are kept."
  confirmLabel="Reset"
  onconfirm={() => board.reset()}
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

  /* Clock card */
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
  .heading {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .time {
    font-size: clamp(3.2rem, 17vw, 6rem);
    line-height: 1;
    font-weight: 700;
  }
  .time.low {
    color: #ef4444;
  }
  .sub {
    font-size: 0.85rem;
    color: var(--muted);
  }
  .format {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .format select,
  .format input {
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 0.95rem;
  }
  .format select {
    padding-right: 28px;
  }
  .format input {
    width: 4.2rem;
    text-align: center;
  }
  .x {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .controls {
    display: flex;
    gap: 8px;
    width: 100%;
    max-width: 420px;
    margin-top: 4px;
  }

  /* Team panels: always side by side, like a real scoreboard */
  .teams {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .team {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: 2px solid var(--border);
    border-top: 6px solid var(--team);
    border-radius: 16px;
    overflow: hidden;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px;
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
  .score {
    flex: 1;
    min-height: 0;
    display: grid;
    place-items: center;
    font-size: clamp(3.5rem, 22vw, 9rem);
    line-height: 1;
    font-weight: 800;
    color: var(--text);
  }
  .goal-row {
    display: flex;
    gap: 6px;
    padding: 8px;
  }
  .goal-row button {
    border-radius: 12px;
    font-weight: 700;
    padding: 14px 10px;
    white-space: nowrap;
    touch-action: manipulation;
    user-select: none;
    cursor: pointer;
  }
  .goal-row button:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .goal {
    flex: 1;
    min-width: 0;
    font-size: 1.1rem;
    background: var(--team);
    color: var(--ink, #fff);
  }
  .goal:not(:disabled):active {
    transform: scale(0.97);
  }
  .undo {
    flex-shrink: 0;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
  }

  /* Goal list */
  .log {
    flex: 0 1 auto;
    max-height: 22%;
    min-height: 44px;
    overflow-y: auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 6px 12px;
  }
  .empty {
    color: var(--muted);
    font-size: 0.85rem;
    text-align: center;
    padding: 6px 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--border);
  }
  li:last-child {
    border-bottom: none;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    flex-shrink: 0;
  }
  .who {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }
  .when {
    color: var(--muted);
  }
  .sc {
    font-weight: 700;
    min-width: 2.6rem;
    text-align: right;
  }

  @media (min-width: 720px) {
    main {
      gap: 16px;
      padding: 16px;
    }
    .teams {
      gap: 16px;
    }
  }
</style>
