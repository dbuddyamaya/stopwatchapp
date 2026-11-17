<script>
  // Slide-out tool menu. Opens from the ☰ button, closes when a tool is
  // picked, the backdrop is tapped, or Escape is pressed.
  import { fade, fly } from 'svelte/transition';

  let { open = $bindable(false), tools, current, onselect, live = {} } = $props();

  function pick(id) {
    onselect(id);
    open = false;
  }
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && (open = false)} />

{#if open}
  <div class="backdrop" transition:fade={{ duration: 150 }} onclick={() => (open = false)} aria-hidden="true"></div>
  <nav class="drawer" transition:fly={{ x: -300, duration: 200, opacity: 1 }} aria-label="Tools">
    <div class="top">
      <span class="app">Possession Clock</span>
      <button class="close" onclick={() => (open = false)} aria-label="Close menu">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
    <ul>
      {#each tools as tool}
        <li>
          <button class="tool" class:active={tool.id === current} onclick={() => pick(tool.id)} aria-current={tool.id === current ? 'page' : undefined}>
            <span class="icon">{@html tool.icon}</span>
            <span class="text">
              <span class="name">
                {tool.name}
                {#if live[tool.id]}<span class="live" title="Clock running">●</span>{/if}
              </span>
              <span class="desc">{tool.description}</span>
            </span>
          </button>
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.45);
    z-index: 40;
  }
  .drawer {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: min(300px, 82vw);
    z-index: 50;
    background: var(--surface);
    border-right: 1px solid var(--border);
    padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 8px 0 24px rgb(0 0 0 / 0.25);
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 4px;
  }
  .app {
    font-weight: 700;
    font-size: 1.05rem;
  }
  .close {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    cursor: pointer;
  }
  svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .tool {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text);
    text-align: left;
    cursor: pointer;
    touch-action: manipulation;
  }
  .tool.active {
    background: color-mix(in srgb, var(--primary, #3b82f6) 14%, transparent);
    border-color: color-mix(in srgb, #3b82f6 45%, transparent);
  }
  .icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--bg);
    flex-shrink: 0;
  }
  .icon :global(svg) {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name {
    font-weight: 600;
  }
  .live {
    color: #22c55e;
    font-size: 0.7rem;
    margin-left: 4px;
    vertical-align: middle;
  }
  .desc {
    font-size: 0.8rem;
    color: var(--muted);
  }
</style>
