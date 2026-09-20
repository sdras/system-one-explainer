// Score: a probability for every level, and one number where they balance.
// The sliders are weights. The beam does the arithmetic in front of you.
import { gsap } from "gsap";
import { createBeam } from "../lib/beam.js";
import { $, $$ } from "../lib/scene.js";
import { createStage, PALETTE } from "../lib/stage3d.js";

const LEVELS = ["calm", "frustrated, civil", "very angry"];
const PRESETS = [
  { name: "All probability at 1", p: [0, 1, 0] },
  { name: "Concentrated near 1", p: [0.05, 0.9, 0.05] },
  { name: "Split between 0 and 2", p: [0.5, 0, 0.5] },
];

export const markup = `
  <div class="instrument-heading">Where the distribution balances</div>
  <div class="viewport viewport-score"></div>
  <p class="equation mono" aria-live="polite"></p>
  <div class="controls">
    <div class="sliders">
      ${LEVELS.map((name, i) => `<label><span class="mono">${i}</span> <span class="muted">${name}</span><input type="range" min="0" max="100" value="0" data-level="${i}"></label>`).join("")}
    </div>
    <div class="presets">${PRESETS.map((preset, i) => `<button type="button" data-preset="${i}">${preset.name}</button>`).join("")}</div>
  </div>
`;

export function build(el) {
  const stage = createStage(el.querySelector(".viewport"), {
    bounds: { x: [-60, 480], y: [120, 370], z: 240 },
    label: "A balance beam marked 0, 1 and 2. Weights stand on the levels in proportion to their probability, and the fulcrum sits where the beam balances, which is the score.",
  });
  const sliders = $$(el, "input[type=range]");
  const equation = $(el, ".equation");

  // The ruler on the floor, and a marker that follows the fulcrum out to the score.
  stage.box({ x: 0, y: 245, w: 400, d: 3, h: 0.5, color: PALETTE.muted });
  [0, 200, 400].forEach((x, i) => {
    stage.box({ x: x - 2, y: 236, w: 4, d: 22, h: 0.5, color: PALETTE.muted });
    stage.label(String(i), { x, y: 300, size: 42, color: PALETTE.muted, align: "center" });
  });
  [0, 200, 400].forEach((x) => {
    stage.ring({ x, y: 190, z: 1, r: 54, tube: 1, color: PALETTE.score, opacity: 0.45 });
  });
  stage.path([[0, 275, 3], [200, 275, 3], [400, 275, 3]], PALETTE.score, 1.2);
  const marker = stage.box({ x: -2, y: 232, w: 4, d: 84, h: 0.8, color: PALETTE.score });
  const reading = stage.label("1.00", { x: 0, y: 358, size: 42, color: PALETTE.score, align: "center" });

  const beam = createBeam(stage, {
    x: 0,
    y: 190,
    spacing: 200,
    plank: { d: 44, h: 8, overhang: 36 },
    wedge: { w: 48, d: 80, h: 60 },
    weight: { size: 50, tallest: 160 },
    tags: { size: 15 },
    onDraw({ ps, fulcrum, tip }) {
      marker.position.x = tip;
      reading.userData.x = tip;
      stage.setText(reading, fulcrum.toFixed(2));
      const score = ps[1] + 2 * ps[2]; // the equation, literally
      equation.innerHTML = `${ps.map((p, i) => `<span class="muted">${i} ×</span> ${p.toFixed(2)}`).join(' <span class="muted">+</span> ')} <span class="muted">=</span> <strong>${score.toFixed(2)}</strong>`;
    },
  });

  el.addEventListener("animation-stop", () => gsap.killTweensOf(beam.view));

  const setSliders = (p) => sliders.forEach((s, i) => (s.value = Math.round(p[i] * 100)));
  sliders.forEach((slider) =>
    slider.addEventListener("input", () => {
      // Sliders are weights. Probabilities are the weights, normalised.
      const weights = sliders.map((s) => Number(s.value));
      const total = weights.reduce((a, b) => a + b, 0);
      beam.to(total ? weights.map((w) => w / total) : [1 / 3, 1 / 3, 1 / 3], { duration: 0.35 });
    }),
  );
  $$(el, "[data-preset]").forEach((button) =>
    button.addEventListener("click", () => {
      const { p } = PRESETS[button.dataset.preset];
      setSliders(p);
      beam.to(p, { duration: 0.8 });
    }),
  );

  beam.draw();
  setSliders(PRESETS[0].p);
  // The intro is the first preset growing from nothing. The callback sits a hair
  // after zero so that Replay crosses it again.
  return gsap.timeline({ paused: true }).add(() => {
    Object.assign(beam.view, { p0: 0, p1: 0, p2: 0, fulcrum: 1, tilt: 0 });
    setSliders(PRESETS[0].p);
    beam.to(PRESETS[0].p, { duration: 1.1 });
  }, 0.02);
}
