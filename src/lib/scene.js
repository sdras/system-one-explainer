// Every scene is markup plus a paused GSAP timeline. This mounts the markup,
// plays the timeline when the scene scrolls into view, and adds a replay button.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const svg = (width, height, label, body) =>
  `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">${body}</svg>`;

/**
 * @param {HTMLElement} el      the .stage element
 * @param {object}      scene   { markup, build(el) -> timeline, loop }
 * A looping scene plays only while it is on screen. Everything else plays once
 * on the way in, and again whenever someone presses Replay.
 */
export function mount(el, { markup, build, loop = false }) {
  el.innerHTML = markup;
  let timeline;
  try {
    timeline = build(el);
  } catch (error) {
    // Most likely no WebGL. The scene's HTML (tables, controls) is already in place, and the page carries on.
    console.warn(`Scene "${el.dataset.scene}" could not start.`, error);
  }
  if (!timeline) return;
  if (import.meta.env.DEV) el.timeline = timeline; // $0.timeline.progress(0.5) in the console

  if (reduceMotion) {
    // No motion: show where each scene ends up.
    timeline.pause().progress(1);
    return;
  }

  if (loop) {
    ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onToggle: (self) => (self.isActive ? timeline.play() : timeline.pause()) });
    return;
  }

  let stopped = false;
  ScrollTrigger.create({ trigger: el, start: "top 72%", once: true, onEnter: () => {
    if (!stopped) timeline.play();
  } });
  const controls = document.createElement("div");
  controls.className = "playback-controls";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "Animation playback");
  const replay = document.createElement("button");
  replay.type = "button";
  replay.className = "replay";
  replay.textContent = "Replay";
  const stop = document.createElement("button");
  stop.type = "button";
  stop.className = "replay stop";
  stop.textContent = "Stop";
  const stopMotion = () => {
    timeline.pause();
    // Interactive scenes may start tweens outside their entrance timeline.
    el.dispatchEvent(new Event("animation-stop"));
  };
  replay.addEventListener("click", () => {
    stopMotion();
    stopped = false;
    el.dispatchEvent(new Event("animation-replay"));
    timeline.restart();
  });
  stop.addEventListener("click", () => {
    stopped = true;
    stopMotion();
  });
  controls.append(replay, stop);
  el.append(controls);
}

/** Tween a number and write it somewhere on every tick. */
export function count(target, { from = 0, to, duration = 1, format = (n) => n.toFixed(2), ease = "power2.out" }) {
  const proxy = { n: from };
  const write = () => (target.textContent = format(proxy.n));
  return gsap.fromTo(proxy, { n: from }, { n: to, duration, ease, onUpdate: write, onStart: write, immediateRender: false });
}

export const $ = (root, selector) => root.querySelector(selector);
export const $$ = (root, selector) => [...root.querySelectorAll(selector)];
