<script>
  // App shell: the slide-out tool menu and whichever tool is selected.
  // Every tool keeps its state (and running clock) while another one is shown.
  import { onMount } from 'svelte';
  import { useGame } from './lib/game.svelte.js';
  import { useScoreboard } from './lib/scoreboard.svelte.js';
  import { useRotation } from './lib/rotation.svelte.js';
  import { useCompetition } from './lib/competition.svelte.js';
  import { setWakeLock, resetWakeLock } from './lib/wakeLock.js';
  import NavDrawer from './components/NavDrawer.svelte';
  import PossessionView from './components/PossessionView.svelte';
  import ScoreboardView from './components/ScoreboardView.svelte';
  import RotationView from './components/RotationView.svelte';
  import DrillsView from './components/DrillsView.svelte';
  import CompetitionView from './components/CompetitionView.svelte';

  const TOOL_KEY = 'possession-clock-tool';
  const tools = [
    {
      id: 'possession',
      name: 'Possession clock',
      description: 'Time each team has the ball',
      icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13.5" r="8" /><path d="M12 13.5V9M10 2.5h4M18.5 6l1.5-1.5" /></svg>'
    },
    {
      id: 'scoreboard',
      name: 'Scoreboard',
      description: 'Goals and a game clock with halves',
      icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M12 5v14M7 10v4M15.5 10h2v4h-2z" /></svg>'
    },
    {
      id: 'rotation',
      name: 'Winner stays',
      description: '3+ teams take turns, first goal wins',
      icon: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.7M20 4v4.7h-4.7M20 12a8 8 0 0 1-13.7 5.6L4 15.3M4 20v-4.7h4.7" /></svg>'
    },
    {
      id: 'competition',
      name: 'Competition',
      description: 'Timed turns, points and a table',
      icon: '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" /></svg>'
    },
    {
      id: 'drills',
      name: 'Drills',
      description: 'Drill videos and coaching notes',
      icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M10 9.5v5l4.5-2.5z" /></svg>'
    }
  ];

  const game = useGame();
  const board = useScoreboard();
  const rotation = useRotation();
  const competition = useCompetition();
  let menuOpen = $state(false);

  let tool = $state(
    (() => {
      try {
        const saved = localStorage.getItem(TOOL_KEY);
        if (tools.some((t) => t.id === saved)) return saved;
      } catch {
        // storage unavailable
      }
      return 'possession';
    })()
  );

  function select(id) {
    tool = id;
    try {
      localStorage.setItem(TOOL_KEY, id);
    } catch {
      // storage unavailable
    }
  }

  /** A dot in the menu for a tool whose clock is running in the background. */
  let live = $derived({
    possession: game.started && !game.stopped,
    scoreboard: board.running,
    rotation: rotation.running,
    competition: competition.running
  });

  // Keep the screen on while any tool's clock is running.
  const keepAwake = () => live.possession || live.scoreboard || live.rotation || live.competition;
  $effect(() => {
    setWakeLock(keepAwake());
  });

  onMount(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      game.now = Date.now();
      board.tick();
      rotation.tick();
      competition.tick();
      resetWakeLock(keepAwake());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });
</script>

{#if tool === 'scoreboard'}
  <ScoreboardView {board} onmenu={() => (menuOpen = true)} />
{:else if tool === 'rotation'}
  <RotationView {rotation} onmenu={() => (menuOpen = true)} />
{:else if tool === 'competition'}
  <CompetitionView comp={competition} onmenu={() => (menuOpen = true)} />
{:else if tool === 'drills'}
  <DrillsView onmenu={() => (menuOpen = true)} />
{:else}
  <PossessionView {game} onmenu={() => (menuOpen = true)} />
{/if}

<NavDrawer bind:open={menuOpen} {tools} current={tool} onselect={select} {live} />
