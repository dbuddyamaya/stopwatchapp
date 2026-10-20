<script>
  // One team: editable name and color, the watch, and its share of possession.
  import Input from 'flowbite-svelte/Input.svelte';
  import Dial from './Dial.svelte';

  let { team = $bindable(), number, ms, pct, running, stopped, ontoggle } = $props();

  let action = $derived(stopped ? 'Final' : running ? 'Tap to pause' : 'Tap to start');
</script>

<div class="team" class:running class:stopped style="--team:{team.color}">
  <div class="head">
    <input class="color" type="color" bind:value={team.color} aria-label="{team.name} color" />
    <div class="min-w-0 flex-1">
      <Input
        size="sm"
        bind:value={team.name}
        maxlength={24}
        aria-label="Team {number} name"
        class="name font-semibold"
      />
    </div>
  </div>

  <button class="clock" onclick={ontoggle} aria-pressed={running}>
    <span class="dial">
      <Dial {ms} color={team.color} {running} label={team.name} />
    </span>
  </button>

  <!-- Second tap target so the text also toggles; the watch button is the accessible one. -->
  <button class="info" onclick={ontoggle} tabindex="-1" aria-hidden="true">
    <span class="pct">{pct.toFixed(1)}% of possession</span>
    <span class="action">{action}</span>
  </button>
</div>

<style>
  /* The card is a size container so the watch can fill whatever space is left. */
  .team {
    min-width: 0;
    min-height: 0;
    container-type: size;
    display: grid;
    grid-template-areas: 'head' 'dial' 'info';
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    transition: border-color 0.15s, background 0.15s;
  }
  .team.running {
    border-color: var(--team);
    background: color-mix(in srgb, var(--team) 14%, var(--surface));
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--team) 25%, transparent);
  }

  .head {
    grid-area: head;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
    min-width: 0;
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

  .clock,
  .info {
    border: none;
    background: transparent;
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
    min-height: 0;
    min-width: 0;
  }
  .stopped .clock,
  .stopped .info {
    cursor: default;
  }
  .clock {
    grid-area: dial;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
  }
  .info {
    grid-area: info;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 0 8px 12px;
  }
  .clock:focus,
  .info:focus {
    outline: none;
  }
  .clock:focus-visible {
    outline: 3px solid var(--team);
    outline-offset: -3px;
    border-radius: 12px;
  }
  .clock:active .dial {
    transform: scale(0.98);
  }
  .dial {
    display: block;
    width: min(100cqw - 20px, 100cqh - 115px, 460px);
    transition: transform 0.08s;
  }
  .pct {
    font-size: 0.85rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .action {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--team);
  }

  /* Phones: watch on the left, name and text on the right. */
  @media (max-width: 719px) and (orientation: portrait), (max-height: 500px) {
    .team {
      grid-template-areas: 'dial head' 'dial info';
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
    }
    .head {
      border-bottom: none;
      padding: 10px 10px 0 4px;
    }
    .info {
      align-items: flex-start;
      justify-content: center;
      text-align: left;
      padding: 0 10px;
    }
    .clock {
      padding: 8px 4px 8px 8px;
    }
    .dial {
      width: min(100cqh - 16px, 60cqw);
    }
  }

  @media (min-width: 720px) {
    .pct {
      font-size: 1rem;
    }
  }
</style>
