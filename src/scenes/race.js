// Illustrative comparison of prose and typed answers, not model performance.
// Timers run in real time. The timings are illustrative, not a benchmark.
import { gsap } from "gsap";
import { $, $$, count, svg } from "../lib/scene.js";

const PROSE = ["Route this ticket to technical support.", "The message describes an integration", "failure. The customer is frustrated", "and requests urgent assistance."];
const TTFT = 0.6;
const PER_TOKEN = 0.07;
const JEV = 0.18;

const ANSWERS = [
  { type: "choice", key: "department", value: '"technical"', p: "85%" },
  { type: "score", key: "frustration", value: "1.0", p: "of 2" },
  { type: "noul", key: "is_urgent", value: "1.0", p: "yes" },
];

const words = (line) =>
  line
    .split(" ")
    .map((w) => `<tspan class="tok${w === "technical" ? " tok-hit" : ""}">${w} </tspan>`)
    .join("");

export const markup = svg(
  640,
  410,
  "Illustrative output formats with assumed timings. Prose is displayed word by word and a category is extracted. Jev returns typed answers together. This does not compare measured model performance.",
  `
  <text class="label" x="24" y="30">Generated prose example</text>
  <text class="mono timer" id="race-t-llm" x="616" y="30" text-anchor="end">0.00 s</text>
  <rect class="card" x="24" y="46" width="592" height="116" rx="12"/>
  <rect class="race-caret ink" x="44" y="64" width="9" height="18" rx="2"/>
  ${PROSE.map((line, i) => `<text class="mono gen" x="44" y="${78 + i * 23}">${words(line)}</text>`).join("")}
  <g class="race-parse">
    <text class="mono small muted" x="24" y="190">extractCategory(text)</text>
    <path class="arrow" d="M352 185h36m-7-6 7 6-7 6"/>
    <rect class="pill" x="402" y="168" width="104" height="34" rx="10"/>
    <text class="mono small value" x="454" y="190" text-anchor="middle">"technical"</text>
    <text class="small muted" x="518" y="190">category</text>
  </g>

  <line class="rule" x1="24" y1="228" x2="616" y2="228"/>

  <text class="label" x="24" y="266">Jev typed-answer example</text>
  <text class="mono timer" id="race-t-jev" x="616" y="266" text-anchor="end">0 ms</text>
  ${ANSWERS.map(
    (a, i) => `
    <g class="race-answer">
      <rect class="pill stroke-${a.type}" x="${24 + i * 200}" y="284" width="192" height="64" rx="12"/>
      <text class="mono small ink-${a.type}" x="${40 + i * 200}" y="308">${a.type} · ${a.key}</text>
      <text class="mono value" x="${40 + i * 200}" y="334">${a.value}</text>
      <text class="mono small muted" x="${200 + i * 200}" y="334" text-anchor="end">${a.p}</text>
    </g>`,
  ).join("")}
  <text class="small muted race-note" x="24" y="384">Illustrative timings. LLMs can also produce structured output.</text>
`,
);

export function build(el) {
  const tokens = $$(el, ".tok");
  const llm = $(el, "#race-t-llm");
  const jev = $(el, "#race-t-jev");
  const writing = tokens.length * PER_TOKEN;
  const total = TTFT + writing + 0.35;
  const tl = gsap.timeline({ paused: true });

  tl.set(tokens, { fillOpacity: 0 }, 0)
    .set($$(el, ".race-answer, .race-parse, .race-note"), { autoAlpha: 0 }, 0)
    .set($(el, ".race-caret"), { autoAlpha: 1 }, 0)
    .add(count(llm, { to: total, duration: total, ease: "none", format: (n) => `${n.toFixed(2)} s` }), 0)
    .add(count(jev, { to: JEV * 1000, duration: JEV, ease: "none", format: (n) => `${Math.round(n)} ms` }), 0)

    // Jev: everything lands in one frame.
    .fromTo($$(el, ".race-answer"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "back.out(2)" }, JEV)
    .call(() => jev.classList.add("done"), null, JEV)
    .to($(el, ".race-note"), { autoAlpha: 1, duration: 0.4 }, JEV + 0.3)

    // The language model: wait for the first token, then one word at a time.
    .to($(el, ".race-caret"), { autoAlpha: 0, duration: 0.01, repeat: 5, yoyo: true, repeatDelay: TTFT / 6 }, 0)
    .set($(el, ".race-caret"), { autoAlpha: 0 }, TTFT)
    .to(tokens, { fillOpacity: 1, duration: 0.01, stagger: PER_TOKEN }, TTFT)
    .call(() => $(el, ".tok-hit").classList.add("found"), null, TTFT + writing)
    .fromTo($(el, ".race-parse"), { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.3 }, TTFT + writing)
    .call(() => llm.classList.add("done"), null, total);

  // Classes are not tweens, so clear them by hand whenever the race starts over.
  tl.eventCallback("onStart", () => {
    [llm, jev].forEach((t) => t.classList.remove("done"));
    $(el, ".tok-hit").classList.remove("found");
  });
  return tl;
}
