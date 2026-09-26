import { gsap } from "gsap";

// Fixed teaching examples, not keyword matching or model output.
const examples = [
  { name: "Clear signal", message: '“I was <mark>charged twice</mark> for the same invoice.”', probabilities: [0.94, 0.04, 0.02], explanation: "A clear billing signal. Raise the cutoff above 94% to send even this prediction for review." },
  { name: "Mixed signals", message: '“I <mark>paid for an upgrade</mark>, but the new features are <mark>still locked</mark>.”', probabilities: [0.46, 0.48, 0.06], explanation: "Almost a tie between billing and access. A lower cutoff can allow routing, but it does not make the evidence any clearer." },
  { name: "No context", message: '“<mark>Something is wrong.</mark> Can you help me sort it out?”', probabilities: [0.19, 0.23, 0.58], explanation: "No clear topic. An explicit “other” answer gives the workflow a way to ask for more context." },
];
const categories = ["Billing", "Access", "Other"];
const colors = ["#82aaff", "#ecc48d", "#7fdbca"];
const percent = (value) => `${Math.round(value * 100)}%`;

// Isometric instruments match the guide; controls and decisions remain HTML.
const grid = Array.from({ length: 19 }, (_, i) => {
  const x = i * 48 - 240;
  return `<path d="M ${x} 72 l 420 210 M ${x} 282 l 420 -210" />`;
}).join("");
const towers = categories.map((name, i) => `
  <g class="judgment-tower" data-tower="${i}" style="--tower-color:${colors[i]}">
    <path class="judgment-plinth" d="M -31 0 l 31 -15 l 31 15 l -31 15 Z" />
    <path class="judgment-tower-front" /><path class="judgment-tower-side" />
    <path class="judgment-tower-top" /><path class="judgment-tower-edge" />
    <text class="judgment-tower-value" text-anchor="middle"></text>
    <text class="judgment-tower-label" x="0" y="39" text-anchor="middle">${name}</text>
  </g>`).join("");

export const markup = `
  <div class="judgment" data-route="act">
    <div class="judgment-examples" role="group" aria-label="Choose an example message">
      ${examples.map((example, i) => `<button type="button" data-example="${i}" aria-pressed="${i === 0}">${example.name}</button>`).join("")}
    </div>
    <div class="judgment-input">
      <span class="judgment-label">Support message</span>
      <p class="judgment-message">${examples[0].message}</p>
      <p class="judgment-question">Which team should handle this?</p>
    </div>
    <div class="judgment-drawing">
      <svg class="judgment-svg" viewBox="0 0 660 300" role="img" aria-label="">
        <defs>
          <radialGradient id="judgment-floor-fade"><stop offset="15%" stop-color="white"/><stop offset="100%" stop-color="black"/></radialGradient>
          <mask id="judgment-floor-mask"><rect width="660" height="300" fill="url(#judgment-floor-fade)"/></mask>
          <linearGradient id="judgment-chip-face" x2="0" y2="1"><stop stop-color="#174e6a"/><stop offset="1" stop-color="#08263c"/></linearGradient>
        </defs>
        <g class="judgment-grid" mask="url(#judgment-floor-mask)">${grid}</g>
        <text class="judgment-diagram-label" x="117" y="31" text-anchor="middle">ONE FORWARD PASS</text>
        <text class="judgment-diagram-label" x="446" y="31" text-anchor="middle">PREDICTED TOPIC</text>
        <g class="judgment-wires">
          <path d="M 5 153 H 48 L 79 138" />
          <path d="M 196 167 L 264 201 H 590" />
          <path d="M 330 201 V 226 M 440 201 V 226 M 550 201 V 226" />
        </g>
        <path class="judgment-signal" d="M 5 153 H 48 L 117 118 L 215 167 L 283 201 H 590" />
        <g class="judgment-chip">
          <path class="judgment-chip-shadow" d="M 37 161 L 119 120 L 208 165 L 126 206 Z" />
          <path class="judgment-chip-side" d="M 38 123 L 119 164 L 201 123 V 156 L 119 197 L 38 156 Z" />
          <path class="judgment-chip-top" d="M 38 123 L 119 82 L 201 123 L 119 164 Z" />
          <path class="judgment-chip-rim" d="M 52 123 L 119 89 L 187 123 L 119 157 Z" />
          <path class="judgment-chip-circuit" d="M 74 123 L 119 101 L 164 123 L 119 146 Z M 93 123 L 119 110 L 146 123 L 119 137 Z" />
          <path class="judgment-chip-flash" d="M 52 123 L 119 89 L 187 123 L 119 157 Z" />
          <text class="judgment-chip-type" x="119" y="126" text-anchor="middle">S1</text>
          <path class="judgment-chip-pins" d="M 53 155 v 12 M 67 162 v 12 M 81 169 v 12 M 95 176 v 12 M 143 176 v 12 M 157 169 v 12 M 171 162 v 12 M 185 155 v 12" />
        </g>
        <text class="judgment-pass-note" x="119" y="236" text-anchor="middle">State → probabilities</text>
        <text class="judgment-pass-note judgment-pass-subnote" x="119" y="255" text-anchor="middle">No text generation</text>
        ${towers}
        <g class="judgment-cutoff-line">
          <path d="M 282 0 H 599" /><path class="judgment-cutoff-handle" d="M 600 -4 l 5 4 l -5 4 Z" />
          <text x="605" y="-9" text-anchor="end">80% cutoff</text>
        </g>
      </svg>
      <button class="judgment-replay" type="button" aria-label="Replay the prediction animation"><span aria-hidden="true">↻</span> Replay pass</button>
    </div>
    <div class="judgment-policy">
      <div class="judgment-policy-label"><label for="judgment-cutoff">Auto-route cutoff</label><output for="judgment-cutoff" class="judgment-cutoff-value">80%</output></div>
      <input id="judgment-cutoff" type="range" min="40" max="99" value="80" step="1" aria-describedby="judgment-cutoff-hint" />
      <div class="judgment-range-labels" id="judgment-cutoff-hint"><span>More automatic routing</span><span>More review</span></div>
    </div>
    <div class="judgment-result">
      <span class="judgment-route-icon" aria-hidden="true">↗</span>
      <div><span class="judgment-label">Workflow decision</span><strong class="judgment-verdict">Route to Billing</strong></div>
      <span class="judgment-comparison">94% ≥ 80%</span>
    </div>
    <p class="judgment-explanation">${examples[0].explanation}</p>
    <p class="sr-only judgment-announcement" role="status" aria-atomic="true"></p>
  </div>`;

export function build(el) {
  const root = el.querySelector(".judgment");
  const svg = el.querySelector(".judgment-svg");
  const cutoff = el.querySelector("#judgment-cutoff");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const columns = [...el.querySelectorAll(".judgment-tower")];
  const values = { p0: 0, p1: 0, p2: 0 };
  const timeline = gsap.timeline({ paused: true });
  let selected = 0;

  function draw() {
    columns.forEach((column, i) => {
      const height = 160 * values[`p${i}`];
      column.setAttribute("transform", `translate(${330 + i * 110}, 226)`);
      column.querySelector(".judgment-tower-front").setAttribute("d", `M -25 -${height} L 0 ${12 - height} V 12 L -25 0 Z`);
      column.querySelector(".judgment-tower-side").setAttribute("d", `M 0 ${12 - height} L 25 -${height} V 0 L 0 12 Z`);
      column.querySelector(".judgment-tower-top").setAttribute("d", `M -25 -${height} L 0 ${-12 - height} L 25 -${height} L 0 ${12 - height} Z`);
      column.querySelector(".judgment-tower-edge").setAttribute("d", `M -25 -${height} L 0 ${12 - height} L 25 -${height} M 0 ${12 - height} V 12`);
      const label = column.querySelector(".judgment-tower-value");
      label.setAttribute("y", -height - 23);
      label.textContent = percent(values[`p${i}`]);
    });
  }

  function updateDecision(announce = false) {
    const example = examples[selected];
    const best = Math.max(...example.probabilities);
    const winner = example.probabilities.indexOf(best);
    const threshold = Number(cutoff.value) / 100;
    // "Other" abstains, even if it clears the policy cutoff.
    const action = winner === 2 ? "context" : best >= threshold ? "act" : "review";
    const verdict = action === "context" ? "Ask for context" : action === "act" ? `Route to ${categories[winner]}` : "Send for review";
    root.dataset.route = action;
    el.querySelector(".judgment-verdict").textContent = verdict;
    el.querySelector(".judgment-route-icon").textContent = { act: "↗", review: "⤴", context: "?" }[action];
    el.querySelector(".judgment-comparison").textContent = action === "context" ? "Other leads" : `${percent(best)} ${best >= threshold ? "≥" : "<"} ${percent(threshold)}`;
    el.querySelector(".judgment-cutoff-value").textContent = percent(threshold);
    cutoff.setAttribute("aria-valuetext", `${percent(threshold)} probability required to automatically route a named topic`);
    cutoff.style.setProperty("--range-fill", `${(Number(cutoff.value) - 40) / 59 * 100}%`);
    const line = el.querySelector(".judgment-cutoff-line");
    line.setAttribute("transform", `translate(0, ${226 - threshold * 160})`);
    line.querySelector("text").textContent = `${percent(threshold)} cutoff`;
    const distribution = categories.map((name, i) => `${name} ${percent(example.probabilities[i])}`).join(", ");
    svg.setAttribute("aria-label", `One forward pass predicts: ${distribution}. Auto-route cutoff: ${percent(threshold)}. ${verdict}.`);
    columns.forEach((column, i) => column.classList.toggle("is-leading", i === winner));
    if (announce) el.querySelector(".judgment-announcement").textContent = `${example.name}: ${distribution}. Cutoff ${percent(threshold)}. ${verdict}. ${example.explanation}`;
  }

  function prepareAnimation() {
    timeline.pause().clear();
    const target = Object.fromEntries(examples[selected].probabilities.map((p, i) => [`p${i}`, p]));
    gsap.set(el.querySelector(".judgment-chip-flash"), { opacity: 0 });
    gsap.set(el.querySelector(".judgment-signal"), { strokeDashoffset: 740, opacity: 0 });
    if (motion.matches) {
      Object.assign(values, target);
      draw();
      return;
    }
    timeline
      .set(el.querySelector(".judgment-signal"), { opacity: 1 })
      .to(el.querySelector(".judgment-signal"), { strokeDashoffset: 0, duration: 0.85, ease: "power1.inOut" })
      .to(el.querySelector(".judgment-chip-flash"), { opacity: 0.7, duration: 0.18, repeat: 1, yoyo: true }, 0.18)
      .to(values, { ...target, duration: 0.7, ease: "power3.out", onUpdate: draw }, 0.32)
      .to(el.querySelector(".judgment-signal"), { opacity: 0, duration: 0.25 }, 0.85);
  }

  function choose(index) {
    selected = index;
    el.querySelectorAll("[data-example]").forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
    el.querySelector(".judgment-message").innerHTML = examples[index].message;
    el.querySelector(".judgment-explanation").textContent = examples[index].explanation;
    updateDecision(true);
    prepareAnimation();
    timeline.play(0);
  }

  el.querySelectorAll("[data-example]").forEach((button) => button.addEventListener("click", () => choose(Number(button.dataset.example))));
  cutoff.addEventListener("input", () => updateDecision());
  cutoff.addEventListener("change", () => updateDecision(true));
  el.querySelector(".judgment-replay").addEventListener("click", () => {
    timeline.pause();
    Object.assign(values, { p0: 0, p1: 0, p2: 0 });
    draw();
    prepareAnimation();
    timeline.play(0);
  });
  motion.addEventListener("change", () => {
    prepareAnimation();
    if (!motion.matches) timeline.play(0);
  });
  updateDecision();
  draw();
  prepareAnimation();
  return timeline;
}
