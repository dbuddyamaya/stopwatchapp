<script>
  // Team list for "Winner stays": names, colors, starting order, add / remove.
  import Modal from 'flowbite-svelte/Modal.svelte';
  import Button from 'flowbite-svelte/Button.svelte';

  let { open = $bindable(false), rotation, max } = $props();

  let s = $derived(rotation.state);

  /** "On field", "Next", "3rd in line"... */
  const where = (id) => {
    if (s.field.includes(id)) return 'On field';
    const i = s.queue.indexOf(id);
    if (i === 0) return 'Next';
    return `${i + 1}${['th', 'st', 'nd', 'rd'][i + 1] ?? 'th'} in line`;
  };
</script>

<Modal
  bind:open
  title="Teams"
  size="none"
  class="w-[calc(100%-2rem)] max-w-sm"
  classes={{ header: 'p-3 md:p-4 text-base', body: 'p-3 md:p-4', footer: 'p-3 md:p-4' }}
>
  <ul class="list">
    {#each s.teams as team, i (team.id)}
      <li>
        <input class="color" type="color" bind:value={s.teams[i].color} aria-label="{team.name} color" />
        <div class="grow">
          <input class="name" bind:value={s.teams[i].name} maxlength="24" aria-label="Team name" />
          <span class="where">{where(team.id)}</span>
        </div>
        {#if !rotation.sessionStarted}
          <button class="mini" onclick={() => rotation.moveUp(i)} disabled={i === 0} aria-label="Move {team.name} up" title="Move up">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
          </button>
        {/if}
        <button
          class="mini"
          onclick={() => rotation.removeTeam(team.id)}
          disabled={!rotation.canRemove(team.id)}
          aria-label="Remove {team.name}"
          title={s.field.includes(team.id) ? "Can't remove a team on the field" : 'Remove'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </li>
    {/each}
  </ul>
  <p class="hint">
    {rotation.sessionStarted
      ? 'New teams join the back of the line.'
      : 'The first two teams play the first match; the rest wait in this order.'}
  </p>
  {#snippet footer()}
    <div class="flex w-full justify-between gap-2">
      <Button size="sm" color="alternative" disabled={s.teams.length >= max} onclick={() => rotation.addTeam()}>
        + Add team
      </Button>
      <Button size="sm" onclick={() => (open = false)}>Done</Button>
    </div>
  {/snippet}
</Modal>

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .color {
    width: 30px;
    height: 30px;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: none;
    flex-shrink: 0;
    cursor: pointer;
  }
  .grow {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .name {
    width: 100%;
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 8px;
    font-weight: 600;
    font-size: 0.95rem;
  }
  .where {
    font-size: 0.72rem;
    color: var(--muted);
    padding: 2px 2px 0;
  }
  .mini {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    cursor: pointer;
  }
  .mini:disabled {
    opacity: 0.3;
    cursor: default;
  }
  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .hint {
    margin-top: 10px;
    font-size: 0.8rem;
    color: var(--muted);
  }
</style>
