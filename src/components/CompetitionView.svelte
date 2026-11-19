<script>
  // Competition tool: setup screen, then one turn at a time (clock, player,
  // point buttons) with the points table underneath.
  import Button from 'flowbite-svelte/Button.svelte';
  import Modal from 'flowbite-svelte/Modal.svelte';
  import MenuButton from './MenuButton.svelte';
  import ThemeButton from './ThemeButton.svelte';
  import IconButton from './IconButton.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import CompetitionSettings from './CompetitionSettings.svelte';

  let { comp, onmenu } = $props();
  let settingsOpen = $state(false);
  let confirmReset = $state(false);

  let s = $derived(comp.state);
  let c = $derived(comp);

  const pad = (n) => String(n).padStart(2, '0');
  const clock = (ms) => {
    const sec = Math.ceil(ms / 1000);
    return `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
  };
  const sign = (v) => (v > 0 ? `+${v}` : `−${Math.abs(v)}`);
  const pts = (n) => `${n} ${Math.abs(n) === 1 ? 'pt' : 'pts'}`;
  const roundLabel = (r) => {
    const name = s.rounds[r]?.name?.trim();
    return `Round ${r + 1} of ${s.rounds.length}${name ? ` · ${name}` : ''}`;
  };

  let atEnd = $derived(s.phase === 'done' && !c.next);
  let winner = $derived(c.table[0]);
</script>

<main>
  <header class="flex items-center justify-between gap-3">
    <div class="flex min-w-0 items-center gap-2.5">
      <MenuButton onclick={onmenu} />
      <span class="truncate text-lg font-semibold">Competition</span>
    </div>
    <div class="flex items-center gap-2">
      {#if c.started}
        <IconButton label="Settings" onclick={() => (settingsOpen = true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" />
          </svg>
        </IconButton>
      {/if}
      <ThemeButton />
    </div>
  </header>

  {#if s.phase === 'setup'}
    <div class="setup">
      <CompetitionSettings {comp} />
    </div>
    <Button color="green" class="w-full" onclick={() => comp.begin()} disabled={s.players.length === 0}>
      Start competition
    </Button>
  {:else}
    <section class="turn" class:running={c.running} class:done={s.phase === 'done'} class:final={s.phase === 'final'}>
      {#if s.phase === 'final'}
        <span class="label">Final · {s.rounds.length} {s.rounds.length === 1 ? 'round' : 'rounds'}</span>
        <span class="who">{winner?.name ?? '—'} wins</span>
        <span class="sub">{winner ? pts(winner.total) : ''}</span>
        <div class="controls">
          <Button color="green" class="flex-1 whitespace-nowrap" onclick={() => comp.addRound()}>Add a round</Button>
          <Button color="light" class="whitespace-nowrap" onclick={() => (confirmReset = true)}>New competition</Button>
        </div>
      {:else}
        <span class="label">{roundLabel(s.round)}</span>
        <div class="main-row">
          <div class="left">
            <span class="who">{c.current?.name ?? '—'}</span>
            <span class="tally tabular-nums">{pts(c.currentPoints)}</span>
          </div>
          <span class="time tabular-nums" class:low={c.running && c.remaining <= 10000}>{clock(c.remaining)}</span>
        </div>

        {#if s.phase === 'done'}
          <div class="next">
            {#if c.next}
              <span>Time! Up next: <b>{c.next.player.name}</b></span>
              {#if c.next.round !== s.round}
                <span class="newround">New round: {roundLabel(c.next.round)}</span>
              {/if}
            {:else}
              <span>Time! That was the last turn.</span>
            {/if}
          </div>
        {/if}

        <div class="controls">
          {#if atEnd}
            <Button color="green" class="flex-1 whitespace-nowrap" onclick={() => comp.addRound()}>Add a round</Button>
            <Button color="light" class="whitespace-nowrap" onclick={() => comp.finish()}>Finish</Button>
          {:else}
            <Button
              color={c.running ? 'alternative' : 'green'}
              class="min-w-0 flex-1 truncate"
              onclick={() => comp.primary()}
            >
              {#if s.phase === 'running'}Pause
              {:else if s.phase === 'paused'}Resume
              {:else if s.phase === 'done'}Start {c.next.player.name}
              {:else}Start {c.current?.name}{/if}
            </Button>
            {#if c.inTurn}
              <Button color="light" class="whitespace-nowrap" onclick={() => comp.endTurn()}>End turn</Button>
            {:else}
              <Button color="light" class="whitespace-nowrap" onclick={() => comp.skip()}>
                {s.phase === 'done' ? 'Skip next' : 'Skip'}
              </Button>
            {/if}
          {/if}
        </div>
      {/if}
    </section>

    {#if s.phase !== 'final'}
      <section class="points" aria-label="Points">
        {#each s.buttons as v}
          <button
            class="pt"
            class:neg={v < 0}
            onclick={() => comp.score(v)}
            disabled={!(c.inTurn || s.phase === 'done')}
          >
            {sign(v)}
          </button>
        {/each}
        <button class="undo" onclick={() => comp.undoPoint()} disabled={!c.canUndo} aria-label="Undo last point" title="Undo last point">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
        </button>
      </section>
      {#if s.phase === 'done' && c.current}
        <p class="late">Late points still go to {c.current.name} until the next turn starts.</p>
      {/if}
    {/if}

    <section class="standings" aria-label="Points table">
      <table>
        <thead>
          <tr>
            <th class="t">Player</th>
            {#each s.rounds as round, r}
              <th title={round.name || `Round ${r + 1}`} class:now={r === s.round && s.phase !== 'final'}>R{r + 1}</th>
            {/each}
            <th class="tot">Total</th>
          </tr>
        </thead>
        <tbody>
          {#each c.table as row, i (row.id)}
            <tr class:current={row.id === c.current?.id && s.phase !== 'final'}>
              <td class="t">
                <div class="tcell"><span class="pos">{i + 1}</span><span class="tn">{row.name}</span></div>
              </td>
              {#each row.perRound as v}
                <td class:empty={v === null}>{v ?? '–'}</td>
              {/each}
              <td class="tot">{row.total}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}
</main>

<Modal
  bind:open={settingsOpen}
  title="Competition settings"
  size="none"
  class="w-[calc(100%-2rem)] max-w-md"
  classes={{ header: 'p-3 md:p-4 text-base', body: 'p-3 md:p-4', footer: 'p-3 md:p-4' }}
>
  <CompetitionSettings {comp} />
  {#snippet footer()}
    <div class="flex w-full justify-between gap-2">
      <Button size="sm" color="alternative" onclick={() => { settingsOpen = false; confirmReset = true; }}>New competition</Button>
      <Button size="sm" onclick={() => (settingsOpen = false)}>Done</Button>
    </div>
  {/snippet}
</Modal>

<ConfirmDialog
  bind:open={confirmReset}
  title="Start a new competition?"
  message="All points are cleared. Players, turn length, point buttons and rounds are kept."
  confirmLabel="New competition"
  onconfirm={() => comp.reset()}
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
    max-width: 900px;
    margin: 0 auto;
  }
  .setup {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 14px;
  }

  .turn {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 16px;
    flex-shrink: 0;
  }
  .turn.running {
    border-color: #22c55e;
  }
  .turn.done {
    border-color: #f59e0b;
  }
  .turn.final {
    align-items: center;
    border-color: #3b82f6;
  }
  .label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #3b82f6;
  }
  .main-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .left {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .who {
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1.15;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tally {
    font-size: 1.05rem;
    font-weight: 700;
    color: #22c55e;
  }
  .sub {
    color: var(--muted);
  }
  .time {
    font-size: clamp(2.8rem, 15vw, 4rem);
    line-height: 1;
    font-weight: 700;
    flex-shrink: 0;
  }
  .time.low {
    color: #ef4444;
  }
  .next {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.9rem;
  }
  .newround {
    font-weight: 700;
    color: #f59e0b;
  }
  .controls {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .points {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .pt {
    flex: 1;
    min-width: 0;
    padding: 16px 4px;
    border-radius: 12px;
    font-size: 1.35rem;
    font-weight: 800;
    background: #16a34a;
    color: #fff;
    touch-action: manipulation;
    user-select: none;
    cursor: pointer;
    font-variant-numeric: tabular-nums;
  }
  .pt.neg {
    background: #dc2626;
  }
  .pt:not(:disabled):active {
    transform: scale(0.96);
  }
  .pt:disabled,
  .undo:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .undo {
    width: 52px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }
  .undo svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .late {
    font-size: 0.78rem;
    color: var(--muted);
    margin-top: -2px;
  }

  .standings {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2px 10px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
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
    padding: 5px 4px;
    min-width: 2.2rem;
  }
  th.now {
    color: #3b82f6;
  }
  td {
    text-align: center;
    padding: 5px 4px;
    border-top: 1px solid var(--border);
  }
  td.empty {
    color: var(--muted);
  }
  th.t,
  td.t {
    text-align: left;
    width: 100%;
  }
  .tcell {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .pos {
    width: 1.1rem;
    color: var(--muted);
    font-size: 0.8rem;
  }
  .tn {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 10rem;
  }
  .tot {
    font-weight: 800;
  }
  tr.current td {
    background: color-mix(in srgb, #3b82f6 14%, transparent);
  }
  tr.current .tn {
    font-weight: 700;
  }
</style>
