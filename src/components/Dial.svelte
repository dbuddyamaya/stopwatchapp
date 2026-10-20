<script>
  import { formatDial } from '../lib/format.js';

  // Analog stopwatch face: the hand sweeps once every 60 seconds.
  let { ms = 0, color = '#ff9500', running = false, label = '' } = $props();

  const C = 150;
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const numbers = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);

  const polar = (r, deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  let angle = $derived(((ms % 60000) / 60000) * 360);
  let minutes = $derived(Math.floor(ms / 60000));
</script>

<svg viewBox="0 0 300 300" role="img" aria-label="{label} {formatDial(ms)}">
  <circle cx={C} cy={C} r="148" fill="var(--face)" />
  {#if running}
    <circle cx={C} cy={C} r="145" fill="none" stroke={color} stroke-width="3" opacity="0.9" />
  {/if}

  {#each ticks as i}
    {@const major = i % 5 === 0}
    {@const [x1, y1] = polar(major ? 118 : 124, i * 6)}
    {@const [x2, y2] = polar(134, i * 6)}
    <line
      {x1}
      {y1}
      {x2}
      {y2}
      stroke={major ? '#ffffff' : '#6b7280'}
      stroke-width={major ? 3 : 1.6}
      stroke-linecap="round"
    />
  {/each}

  {#each numbers as n}
    {@const [x, y] = polar(98, n * 6)}
    <text {x} {y} class="num" text-anchor="middle" dominant-baseline="central">{n}</text>
  {/each}

  <text x={C} y="196" class="digital" text-anchor="middle">{formatDial(ms)}</text>
  {#if minutes > 0}
    <text x={C} y="104" class="mins" text-anchor="middle">{minutes} min</text>
  {/if}

  <g transform="rotate({angle} {C} {C})">
    <line x1={C} y1={C + 20} x2={C} y2="18" stroke={color} stroke-width="2.6" stroke-linecap="round" />
  </g>
  <circle cx={C} cy={C} r="5" fill={color} />
  <circle cx={C} cy={C} r="2" fill="var(--face)" />
</svg>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .num {
    fill: #ffffff;
    font-size: 22px;
    font-weight: 400;
  }
  .digital {
    fill: #ffffff;
    font-size: 25px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }
  .mins {
    fill: #9aa3ad;
    font-size: 13px;
  }
</style>
