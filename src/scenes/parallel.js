// Forty questions, two ways. One per round trip, or all in one request.
// Jev answers the questions in a request in parallel, so you can ask
// speculatively and let code pick the answers it turns out to need.
import { gsap } from "gsap";
import { $, $$, count, svg } from "../lib/scene.js";

const COLS = 8;
const TOTAL = 40;
const GAP = 30;
const DOT_RADIUS = 9;
const ROUND_TRIP = 0.12;
const NEEDED = [16, 17, 18, 19, 20];
const typeOf = (i) => (i % 5 === 0 ? "choice" : i % 7 === 3 ? "score" : "noul");

// Build the outline from the same positions as the selected dots. A path
// also lets DrawSVG measure the rounded ends rather than a rect's perimeter.
const batchOrigin = { x: 390, y: 92 };
const selectedX = NEEDED.map((i) => batchOrigin.x + (i % COLS) * GAP);
const selectedY = batchOrigin.y + Math.floor(NEEDED[0] / COLS) * GAP;
const outlineRadius = DOT_RADIUS + 7;
const outlineLeft = Math.min(...selectedX);
const outlineRight = Math.max(...selectedX);
const outline = `M ${outlineLeft} ${selectedY - outlineRadius}
  H ${outlineRight}
  a ${outlineRadius} ${outlineRadius} 0 0 1 0 ${outlineRadius * 2}
  H ${outlineLeft}
  a ${outlineRadius} ${outlineRadius} 0 0 1 0 ${-outlineRadius * 2} Z`;

const grid = (x, y, name) =>
  Array.from({ length: TOTAL }, (_, i) => `<circle class="dot ${name} fill-${typeOf(i)}" cx="${x + (i % COLS) * GAP}" cy="${y + Math.floor(i / COLS) * GAP}" r="${DOT_RADIUS}"/>`).join("");

export const markup = svg(
  640,
  290,
  "Illustration with assumed timings, not a benchmark. Two grids of forty questions. On the left they are answered one after another and it takes almost five seconds. On the right they are all answered at once in about a tenth of a second, and the code keeps only the five answers it needs.",
  `
  <text class="label" x="40" y="36">Sequential requests</text>
  <text class="mono timer" id="par-t-serial" x="250" y="62" text-anchor="end">0.00 s</text>
  ${grid(40, 92, "serial")}
  <text class="small muted" x="40" y="256">40 round trips</text>

  <line class="rule" x1="320" y1="20" x2="320" y2="264"/>

  <text class="label" x="390" y="36">Combined request</text>
  <text class="mono timer" id="par-t-batch" x="600" y="62" text-anchor="end">0 ms</text>
  ${grid(batchOrigin.x, batchOrigin.y, "batch")}
  <path class="par-needed" d="${outline}"/>
  <text class="small muted par-note" x="390" y="256">1 round trip. Code reads the 5 it needs.</text>
`,
);

export function build(el) {
  const serial = $(el, "#par-t-serial");
  const batch = $(el, "#par-t-batch");
  const batchDots = $$(el, ".dot.batch");
  const spare = batchDots.filter((_, i) => !NEEDED.includes(i));
  const tl = gsap.timeline({ paused: true });

  tl.set($$(el, ".dot"), { fillOpacity: 0.16, attr: { r: DOT_RADIUS } }, 0)
    .set($$(el, ".par-note"), { autoAlpha: 0 }, 0)
    .set($(el, ".par-needed"), { drawSVG: "0%" }, 0)
    .add(count(serial, { to: TOTAL * ROUND_TRIP, duration: TOTAL * ROUND_TRIP, ease: "none", format: (n) => `${n.toFixed(2)} s` }), 0)
    .add(count(batch, { to: ROUND_TRIP * 1000, duration: ROUND_TRIP, ease: "none", format: (n) => `${Math.round(n)} ms` }), 0)

    .to($$(el, ".dot.serial"), { fillOpacity: 1, duration: 0.01, stagger: ROUND_TRIP }, ROUND_TRIP)
    .call(() => serial.classList.add("done"), null, TOTAL * ROUND_TRIP)

    .to(batchDots, { fillOpacity: 1, duration: 0.01 }, ROUND_TRIP)
    // Radius changes keep SVG centers fixed during playback and replay.
    .fromTo(batchDots, { attr: { r: DOT_RADIUS * 1.5 } }, { attr: { r: DOT_RADIUS }, duration: 0.5, ease: "back.out(3)", immediateRender: false }, ROUND_TRIP)
    .call(() => batch.classList.add("done"), null, ROUND_TRIP)
    .to(spare, { fillOpacity: 0.3, duration: 0.5 }, 1.1)
    .to($(el, ".par-needed"), { drawSVG: "100%", duration: 0.6, ease: "power2.inOut" }, 1.1)
    .to($(el, ".par-note"), { autoAlpha: 1, duration: 0.4 }, 1.4);

  tl.eventCallback("onStart", () => [serial, batch].forEach((t) => t.classList.remove("done")));
  return tl;
}
