// One request. Three questions go through the door side by side, and three
// typed answers leave together. Above: the machine. Below: the same exchange as
// data, straight from the quickstart on docs.typesafe.ai.
import { gsap } from "gsap";
import { $$ } from "../lib/scene.js";
import { Color, createStage, makeTicket, MONO, PALETTE } from "../lib/stage3d.js";

const STATE = "Hi, I've been trying to connect my Stripe account for 3 days and the integration keeps failing. I'm losing sales. Please help ASAP.";

const ROWS = [
  { type: "choice", key: "department", asks: "Which team should handle this", value: '"technical"', detail: "p 0.85 · confidence 0.78", note: "0.85" },
  { type: "score", key: "frustration", asks: "How frustrated the customer appears", value: "1.0", detail: "of 0–2 · confidence 1.0", note: "of 2" },
  { type: "noul", key: "is_urgent", asks: "The message conveys urgency or time-sensitivity", value: "1.0", detail: "probability of yes", note: "yes" },
];

const callout = (n) => `<span class="callout" aria-hidden="true">${n}</span>`;

export const markup = `
  <div class="viewport viewport-request"></div>
  <div class="exchange">
    <div class="exchange-state">
      <div class="cell-head">${callout(1)} state</div>
      <p class="mono">"${STATE}"</p>
    </div>
    <div class="exchange-rows">
      <div class="exchange-row exchange-head"><div class="cell-head">${callout(2)} questions</div><div class="cell-head">${callout(3)} answers</div></div>
      ${ROWS.map(
        (row) => `
        <div class="exchange-row">
          <div class="question mono"><span><span class="ink-${row.type}">${row.type}</span> <span class="k">${row.key}</span></span><span class="muted">${row.asks}</span></div>
          <div class="answer mono"><span class="answer-value ink-${row.type}">${row.value}</span><span class="muted">${row.detail}</span></div>
        </div>`,
      ).join("")}
      <div class="exchange-row exchange-foot mono muted"><span>usage: 392 input tokens</span><span>from the TypeSafe quickstart</span></div>
    </div>
  </div>
`;

export function build(el) {
  const stage = createStage(el.querySelector(".viewport"), {
    bounds: { x: [0, 590], y: [90, 360], z: 110 },
    step: 45,
    label: "Three question tokens enter the Jev block side by side, and three answer plates slide out together, reading technical, 1.0 and 1.0.",
  });

  stage.label("STATE + QUESTIONS", { x: 4, y: 322, size: 20 });
  stage.label("ANSWERS, TOGETHER", { x: 346, y: 322, size: 20 });

  stage.box({ x: 0, y: 170, w: 220, d: 80, h: 8, color: PALETTE.belt });
  const ticket = makeTicket(stage, { x: 54, y: 210, z: 8 });
  const tokens = ROWS.map((row, i) => stage.box({ x: 140, y: 176 + i * 25, z: 8, w: 17, d: 17, h: 17, color: PALETTE[row.type] }));
  const block = stage.box({ x: 220, y: 120, w: 100, d: 180, h: 104, color: PALETTE.block });
  const bolt = stage.bolt({ x: 232, y: 168, z: 104, k: 0.6 });

  const plates = [];
  const words = [];
  ROWS.forEach((row, i) => {
    const lane = 132 + i * 58;
    stage.box({ x: 320, y: lane, w: 264, d: 40, h: 6, color: PALETTE.belt });
    plates.push(stage.box({ x: 320, y: lane + 3, z: 6, w: 150, d: 34, h: 9, color: PALETTE[row.type], anchor: "left" }));
    words.push(stage.label(row.value, { x: 382, y: lane + 27, z: 15, size: 17, color: PALETTE.ink, family: MONO, weight: 600 }));
    words.push(stage.label(row.note, { x: 534, y: lane + 27, z: 6, size: 13, color: PALETTE.muted, family: MONO, weight: 400 }));
  });

  // Raised scanning frames expose the path of the three independent questions.
  [205, 245, 285].forEach((x, i) => {
    const ring = stage.ring({ x, y: 210, z: 65, r: 76, tube: 1.4, color: PALETTE.noul, opacity: 0.35 + i * 0.15 });
    ring.rotation.set(0, Math.PI / 2, 0);
  });
  ROWS.forEach((row, i) => {
    const y = 151 + i * 58;
    stage.path([[325, y, 15], [410, y, 20], [560, y, 15]], PALETTE[row.type], 1.4);
    stage.ring({ x: 552, y, z: 8, r: 14, color: PALETTE[row.type], tube: 1 });
  });

  const [white, gold] = [new Color("#ffffff"), new Color(PALETTE.bolt)];
  const flash = { t: 0 };

  // Nothing has come out yet, whether or not the timeline has started.
  plates.forEach((plate) => (plate.scale.x = 0.001));
  words.forEach((word) => (word.material.opacity = 0));

  return gsap
    .timeline({ paused: true, defaults: { ease: "power2.out" } })
    .set(words.map((w) => w.material), { opacity: 0 }, 0)
    .set(plates.map((p) => p.scale), { x: 0.001 }, 0)
    .set($$(el, ".answer"), { autoAlpha: 0 }, 0)
    .fromTo(ticket.position, { x: 54 }, { x: 270, duration: 1.2, ease: "power2.inOut" }, 0.3)
    .fromTo(tokens.map((t) => t.position), { x: 148.5 }, { x: 270, duration: 1.2, ease: "power2.inOut" }, 0.3)
    .to(flash, { t: 1, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut", onUpdate: () => bolt.material.color.lerpColors(gold, white, flash.t) }, 1.45)
    .to(block.scale, { x: 1.03, z: 1.03, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }, "<")

    // Every plate leaves on the same frame. That is the whole point.
    .fromTo(plates.map((p) => p.position), { x: 320 }, { x: 372, duration: 0.7, ease: "back.out(1.4)" }, "out")
    .to(plates.map((p) => p.scale), { x: 1, duration: 0.5 }, "out")
    .to(words.map((w) => w.material), { opacity: 1, duration: 0.35 }, "out+=0.45")
    .fromTo($$(el, ".answer"), { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.4 }, "out+=0.2");
}
