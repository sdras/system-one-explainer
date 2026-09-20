// Jev × WebMCP: a sentence typed into a side panel becomes a tool call while it
// is still being typed. This is a replay, not the model. The route probabilities
// along the way are illustrative. The final call and 164 ms come from the
// jev-webmcp README.
import { gsap } from "gsap";
import { $, $$, svg } from "../lib/scene.js";

const SAID = "got anything gluten free in the bakery aisle?";
const PER_CHAR = 0.075;
const ROUTES = ["search_products", "add_to_cart", "no tool fits"];
const TRACK = { x: 210, width: 330 };

// After this many characters, the routing question looks like this.
const BEATS = [
  { chars: 0, p: [0.2, 0.15, 0.65] },
  { chars: 12, p: [0.55, 0.2, 0.25], show: ".wild-call" },
  { chars: 24, p: [0.9, 0.04, 0.06], show: ".wild-dietary" },
  { chars: 38, p: [0.97, 0.01, 0.02], show: ".wild-department" },
  { chars: SAID.length, p: [0.98, 0.01, 0.01], show: ".wild-ran" },
];

export const markup = svg(
  640,
  336,
  "A sentence is typed: got anything gluten free in the bakery aisle? While it is typed, probability bars settle on the search_products tool and its arguments fill in: department Bakery, dietary gluten-free. All routing probabilities are illustrative. The 164 millisecond label is from a README example, not a measured request here.",
  `
  <rect class="card" x="24" y="16" width="592" height="54" rx="12"/>
  <text class="mono wild-said" x="44" y="50" xml:space="preserve"></text>
  <rect class="wild-caret fill-choice" x="44" y="32" width="2.5" height="24"/>

  ${ROUTES.map(
    (name, i) => `
    <text class="mono small ${i === 2 ? "muted" : "option"}" x="24" y="${112 + i * 32}">${name}</text>
    <rect class="track" x="${TRACK.x}" y="${96 + i * 32}" width="${TRACK.width}" height="22" rx="6"/>
    <rect class="wild-bar ${i === 2 ? "fill-muted" : "fill-choice"}" x="${TRACK.x}" y="${96 + i * 32}" width="0" height="22" rx="6"/>
    <text class="mono small value wild-p" x="616" y="${112 + i * 32}" text-anchor="end">0%</text>`,
  ).join("")}

  <rect class="card" x="24" y="200" width="592" height="120" rx="12"/>
  <g class="wild-call">
    <text class="mono code-line" x="44" y="232"><tspan class="f">search_products</tspan>({</text>
    <text class="mono code-line" x="44" y="304">})</text>
  </g>
  <text class="mono code-line wild-department" x="66" y="256"><tspan class="k">department</tspan>: <tspan class="s">"Bakery"</tspan>,</text>
  <text class="mono code-line wild-dietary" x="66" y="280"><tspan class="k">dietary</tspan>: [<tspan class="s">"gluten-free"</tspan>]</text>
  <g class="wild-ran">
    <rect class="pill stroke-high" x="468" y="214" width="128" height="34" rx="10"/>
    <text class="mono small ink-high" x="532" y="236" text-anchor="middle">164 ms*</text>
    <text class="small muted" x="596" y="304" text-anchor="end">execution policy applies</text>
  </g>
`,
);

export function build(el) {
  const said = $(el, ".wild-said");
  const caret = $(el, ".wild-caret");
  const bars = $$(el, ".wild-bar");
  const values = $$(el, ".wild-p");
  const typed = { chars: 0 };
  const route = { p0: 0, p1: 0, p2: 0 };

  function type() {
    said.textContent = SAID.slice(0, Math.round(typed.chars));
    caret.setAttribute("x", 44 + said.getComputedTextLength() + 2);
  }
  function paint() {
    [route.p0, route.p1, route.p2].forEach((p, i) => {
      bars[i].setAttribute("width", Math.max(p * TRACK.width, 0));
      values[i].textContent = `${Math.round(p * 100)}%`;
    });
  }

  const tl = gsap.timeline({ paused: true });
  tl.set($$(el, ".wild-call, .wild-department, .wild-dietary, .wild-ran"), { autoAlpha: 0 }, 0)
    .fromTo(typed, { chars: 0 }, { chars: SAID.length, duration: SAID.length * PER_CHAR, ease: "none", onUpdate: type }, 0.4)
    .fromTo(caret, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01, repeat: 9, yoyo: true, repeatDelay: 0.45 }, 0);

  BEATS.forEach(({ chars, p, show }) => {
    const at = 0.4 + chars * PER_CHAR;
    tl.to(route, { p0: p[0], p1: p[1], p2: p[2], duration: 0.45, ease: "power2.out", onUpdate: paint }, at);
    if (show) tl.fromTo($$(el, show), { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }, at + 0.1);
  });

  tl.eventCallback("onStart", () => {
    Object.assign(route, { p0: 0, p1: 0, p2: 0 });
    paint();
  });
  return tl;
}
