<script>
  // Small square icon button used in the tool headers (menu, theme).
  let { label, onclick, children, title = label } = $props();
</script>

<button class="icon-btn" {onclick} aria-label={label} {title}>
  {@render children()}
</button>

<style>
  .icon-btn {
    flex-shrink: 0;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    touch-action: manipulation;
  }
  .icon-btn :global(svg) {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
