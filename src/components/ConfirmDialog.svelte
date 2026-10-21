<script>
  // Small yes/no dialog (Flowbite Modal) used for Stop exercise and Reset.
  import Modal from 'flowbite-svelte/Modal.svelte';
  import Button from 'flowbite-svelte/Button.svelte';

  let {
    open = $bindable(false),
    title,
    message,
    confirmLabel,
    confirmColor = 'primary',
    confirmClass = '',
    onconfirm
  } = $props();

  function confirm() {
    open = false;
    onconfirm();
  }
</script>

<Modal
  bind:open
  {title}
  size="none"
  class="w-[calc(100%-2rem)] max-w-xs"
  classes={{ header: 'p-3 md:p-4 text-base', body: 'p-3 md:p-4', footer: 'p-3 md:p-4' }}
>
  <p class="text-sm text-(--muted)">{message}</p>
  {#snippet footer()}
    <div class="flex w-full justify-end gap-2">
      <Button size="sm" color="alternative" onclick={() => (open = false)}>Cancel</Button>
      <Button size="sm" color={confirmColor} class={confirmClass} onclick={confirm}>
        {confirmLabel}
      </Button>
    </div>
  {/snippet}
</Modal>
