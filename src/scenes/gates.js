// Confidence is a second axis to branch on. The thresholds here (0.5 and 0.9)
// illustrate an application policy. Validate cutoffs for each task.
import { gsap } from "gsap";
import { $, $$, reduceMotion, svg } from "../lib/scene.js";

const TIERS = [
  { id: "low", x: 110, range: "below 0.50", action: "gather context", detail: "seek more information" },
  { id: "mid", x: 320, range: "0.50 ≤ c < 0.90", action: "confirm", detail: "ask before acting" },
  { id: "high", x: 530, range: "0.90 and up", action: "act", detail: "if policy permits" },
];
const PATHS = {
  low: "M320 30V92C320 160 110 120 110 238",
  mid: "M320 30V238",
  high: "M320 30V92C320 160 530 120 530 238",
};
const tierOf = (confidence) => (confidence >= 0.9 ? "high" : confidence >= 0.5 ? "mid" : "low");
const START = 0.780; // the quickstart's confidence in "technical"

export const markup = `
  ${svg(
    640,
    350,
    "A marble drops down one of three tracks depending on confidence. Below 0.5 it requests more context, between 0.5 and 0.9 it asks for confirmation, and at 0.9 or more it acts.",
    `
    ${TIERS.map((t) => `<path class="gate-path" id="gate-${t.id}" d="${PATHS[t.id]}"/>`).join("")}
    ${TIERS.map(
      (t) => `
      <g class="gate-bin" data-tier="${t.id}">
        <rect class="card stroke-${t.id}" x="${t.x - 92}" y="250" width="184" height="88" rx="14"/>
        <text class="mono small muted" x="${t.x}" y="276" text-anchor="middle">${t.range}</text>
        <text class="label ink-${t.id}" x="${t.x}" y="302" text-anchor="middle">${t.action}</text>
        <text class="small muted" x="${t.x}" y="324" text-anchor="middle">${t.detail}</text>
      </g>`,
    ).join("")}
    <circle class="marble" r="12"/>
  `,
  )}
  <div class="controls">
    <div class="sliders">
      <label><span class="mono">confidence</span> <output class="mono n">${START.toFixed(3)}</output><input type="range" min="0" max="1" step="0.001" value="${START}"></label>
    </div>
    <div class="presets"><button type="button" data-drop="0.320">Low confidence · 0.320</button><button type="button" data-drop="${START}">Review example · 0.780</button><button type="button" data-drop="1.000">High score · 1.000</button></div>
  </div>
`;

export function build(el) {
  const marble = $(el, ".marble");
  const slider = $(el, "input[type=range]");
  const output = $(el, "output");
  let current = null;
  el.addEventListener("animation-stop", () => gsap.killTweensOf([marble, ...$$(el, ".gate-bin")]));

  function drop(confidence) {
    const tier = tierOf(confidence);
    current = tier;
    $$(el, ".gate-path").forEach((p) => p.classList.toggle("active", p.id === `gate-${tier}`));
    $$(el, ".gate-bin").forEach((b) => b.classList.toggle("active", b.dataset.tier === tier));
    marble.setAttribute("class", `marble fill-${tier}`);
    gsap.set(marble, { autoAlpha: 1 });
    gsap.to(marble, {
      motionPath: { path: `#gate-${tier}`, align: `#gate-${tier}`, alignOrigin: [0.5, 0.5] },
      duration: reduceMotion ? 0 : 0.9,
      ease: "power2.in",
      overwrite: true,
    });
    gsap.fromTo($(el, `.gate-bin[data-tier="${tier}"]`), { y: 0 }, { y: 5, duration: 0.12, yoyo: true, repeat: 1, delay: reduceMotion ? 0 : 0.88, ease: "power1.out" });
  }

  function set(confidence, { force = false } = {}) {
    slider.value = confidence;
    output.textContent = Number(confidence).toFixed(3);
    if (force || tierOf(confidence) !== current) drop(confidence);
  }

  slider.addEventListener("input", () => set(Number(slider.value)));
  $$(el, "[data-drop]").forEach((button) => button.addEventListener("click", () => set(Number(button.dataset.drop), { force: true })));

  gsap.set(marble, { autoAlpha: 0 });
  return gsap.timeline({ paused: true }).add(() => set(Number(slider.value), { force: true }), 0.02);
}
