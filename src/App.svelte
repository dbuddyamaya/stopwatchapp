<script>
  // Page layout: overall bar on top, the two team cards, and the controls.
  import Button from 'flowbite-svelte/Button.svelte';
  import { useGame } from './lib/game.svelte.js';
  import OverallBar from './components/OverallBar.svelte';
  import TeamCard from './components/TeamCard.svelte';
  import ConfirmDialog from './components/ConfirmDialog.svelte';

  const game = useGame();
  let confirmStop = $state(false);
  let confirmReset = $state(false);
</script>

<main>
  <OverallBar
    teams={game.state.teams}
    overall={game.overall}
    disputed={game.disputed}
    share={game.share}
    status={game.status}
    statusColor={game.statusColor}
  />

  <section class="teams">
    {#each game.state.teams as _, i}
      <TeamCard
        bind:team={game.state.teams[i]}
        number={i + 1}
        ms={game.times[i]}
        pct={game.pct[i]}
        running={game.state.running === i}
        stopped={game.stopped}
        ontoggle={() => game.toggle(i)}
      />
    {/each}
  </section>

  <footer class="flex justify-between gap-2">
    <Button color="red" disabled={!game.started || game.stopped} onclick={() => (confirmStop = true)}>
      Stop exercise
    </Button>
    <Button color="alternative" disabled={!game.started} onclick={() => (confirmReset = true)}>
      Reset
    </Button>
  </footer>
</main>

<ConfirmDialog
  bind:open={confirmStop}
  title="Stop the exercise?"
  message="Every watch stops. The final times stay on screen until you reset."
  confirmLabel="Stop exercise"
  confirmColor="red"
  onconfirm={() => game.stopExercise()}
/>
<ConfirmDialog
  bind:open={confirmReset}
  title="Reset both clocks?"
  message="All times go back to 0:00. Team names and colors are kept."
  confirmLabel="Reset"
  onconfirm={() => game.reset()}
/>

<style>
  /* The whole app fits one screen: the watches shrink to the space left. */
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

  .teams {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: minmax(0, 1fr);
    gap: 10px;
  }
  /* Phones in portrait: teams stacked. */
  @media (max-width: 719px) and (orientation: portrait) {
    .teams {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 720px) {
    main,
    .teams {
      gap: 16px;
    }
    main {
      padding: 16px;
    }
  }
</style>
