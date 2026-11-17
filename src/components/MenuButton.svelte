<script>
  // Opens the tool menu.
  import IconButton from './IconButton.svelte';
  let { onclick } = $props();
</script>

<IconButton label="Open menu" {onclick}>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
</IconButton>
