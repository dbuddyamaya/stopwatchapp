<script>
  // Competition settings: players, turn length, point buttons and rounds.
  // Shown as the setup screen, and in a dialog during the competition.
  import { MAX_PLAYERS } from '../lib/competition.svelte.js';

  let { comp } = $props();
  let s = $derived(comp.state);

  let min = $derived(Math.floor(s.turnSec / 60));
  let sec = $derived(s.turnSec % 60);

  const sign = (v) => (v > 0 ? `+${v}` : `${v}`);

  function setButton(i, value) {
    const next = [...s.buttons];
    next[i] = value;
    comp.setButtons(next);
  }
  function removeButton(i) {
    comp.setButtons(s.buttons.filter((_, j) => j !== i));
  }
</script>

<div class="settings">
  <section>
    <h3>Players <span class="count">{s.players.length}</span></h3>
    <ul class="list">
      {#each s.players as player, i (player.id)}
        <li>
          <span class="num">{i + 1}</span>
          <input class="text" bind:value={s.players[i].name} maxlength="24" aria-label="Player name or number" />
          <button class="mini" onclick={() => comp.movePlayer(i, -1)} disabled={i === 0} aria-label="Move {player.name} up" title="Move up">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
          </button>
          <button
            class="mini"
            onclick={() => comp.removePlayer(player.id)}
            disabled={!comp.canRemove(player.id)}
            aria-label="Remove {player.name}"
            title="Remove"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </li>
      {/each}
    </ul>
    <button class="add" onclick={() => comp.addPlayer()} disabled={s.players.length >= MAX_PLAYERS}>+ Add player</button>
    <p class="hint">Players go in this order each round.{comp.started ? ' New players join at the end of the line.' : ''}</p>
  </section>

  <section>
    <h3>Turn length</h3>
    <div class="row">
      <input
        class="small"
        type="number"
        inputmode="numeric"
        min="0"
        max="60"
        value={min}
        disabled={comp.inTurn}
        onchange={(e) => comp.setTurn(e.currentTarget.value, sec)}
        aria-label="Minutes"
      />
      <span class="unit">min</span>
      <input
        class="small"
        type="number"
        inputmode="numeric"
        min="0"
        max="59"
        value={sec}
        disabled={comp.inTurn}
        onchange={(e) => comp.setTurn(min, e.currentTarget.value)}
        aria-label="Seconds"
      />
      <span class="unit">sec</span>
    </div>
  </section>

  <section>
    <h3>Point buttons</h3>
    <div class="buttons">
      {#each s.buttons as value, i}
        <span class="pt" class:neg={value < 0}>
          <input
            type="number"
            inputmode="numeric"
            value={value}
            onchange={(e) => setButton(i, e.currentTarget.value)}
            aria-label="Point value {sign(value)}"
          />
          <button class="x" onclick={() => removeButton(i)} disabled={s.buttons.length <= 1} aria-label="Remove {sign(value)} button">×</button>
        </span>
      {/each}
      {#if s.buttons.length < 6}
        <button class="add inline" onclick={() => comp.setButtons([...s.buttons, 1])}>+ Add</button>
      {/if}
    </div>
    <p class="hint">Use a minus number (like −1) to take points off.</p>
  </section>

  <section>
    <h3>Rounds</h3>
    <div class="row">
      <button class="mini" onclick={() => comp.setRoundCount(s.rounds.length - 1)} aria-label="One round fewer">−</button>
      <span class="rounds tabular-nums">{s.rounds.length}</span>
      <button class="mini" onclick={() => comp.setRoundCount(s.rounds.length + 1)} aria-label="One more round">+</button>
    </div>
    <ul class="list">
      {#each s.rounds as round, i}
        <li>
          <span class="num">R{i + 1}</span>
          <input
            class="text"
            bind:value={s.rounds[i].name}
            maxlength="30"
            placeholder={i === 0 ? 'Name (optional), e.g. Two touch' : i === 1 ? 'e.g. One touch' : 'Name (optional)'}
            aria-label="Round {i + 1} name"
          />
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  h3 {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .count {
    background: var(--bg);
    border-radius: 999px;
    padding: 0 7px;
    letter-spacing: 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  li,
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .num {
    width: 1.7rem;
    flex-shrink: 0;
    text-align: center;
    font-size: 0.8rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  input {
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 5px 8px;
    font-size: 0.92rem;
  }
  input:disabled {
    opacity: 0.5;
  }
  .text {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }
  .text::placeholder {
    font-weight: 400;
    color: var(--muted);
  }
  .small {
    width: 3.6rem;
    text-align: center;
  }
  .unit {
    color: var(--muted);
    font-size: 0.85rem;
    margin-right: 8px;
  }
  .mini {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    font-size: 1.1rem;
    cursor: pointer;
  }
  .mini:disabled,
  .add:disabled,
  .x:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .mini svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .rounds {
    min-width: 2rem;
    text-align: center;
    font-weight: 700;
    font-size: 1.1rem;
  }
  .add {
    align-self: flex-start;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px dashed var(--muted);
    background: transparent;
    color: var(--text);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
  }
  .add.inline {
    align-self: center;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pt {
    display: inline-flex;
    align-items: center;
    border: 1px solid #22c55e;
    border-radius: 10px;
    overflow: hidden;
  }
  .pt.neg {
    border-color: #ef4444;
  }
  .pt input {
    width: 3.2rem;
    border: none;
    border-radius: 0;
    text-align: center;
    font-weight: 700;
  }
  .x {
    width: 28px;
    align-self: stretch;
    border: none;
    border-left: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    font-size: 1.1rem;
    cursor: pointer;
  }
  .hint {
    font-size: 0.78rem;
    color: var(--muted);
  }
</style>
