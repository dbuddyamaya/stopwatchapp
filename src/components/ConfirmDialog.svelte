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
    onconfirm
  } = $props();

  function confirm() {
    open = false;
    onconfirm();
  }
</script>

<Modal bind:open size="xs" {title} autoclose={false}>
  <p class="text-base text-gray-400">{message}</p>
  {#snippet footer()}
    <div class="flex w-full justify-end gap-2">
      <Button color="alternative" onclick={() => (open = false)}>Cancel</Button>
      <Button color={confirmColor} onclick={confirm}>{confirmLabel}</Button>
    </div>
  {/snippet}
</Modal>
