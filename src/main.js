import "@fontsource/big-shoulders-display/700";
import "@fontsource/big-shoulders-display/900";
import "@fontsource/alegreya/latin-400-italic.css";
import "@fontsource-variable/archivo";
import "@fontsource-variable/jetbrains-mono";
import "./style.css";

import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { mount, reduceMotion } from "./lib/scene.js";
import * as choice from "./scenes/choice.js";
import * as gates from "./scenes/gates.js";
import * as machine from "./scenes/machine.js";
import * as noul from "./scenes/noul.js";
import * as parallel from "./scenes/parallel.js";
import * as thinking from "./scenes/thinking.js";
import * as score from "./scenes/score.js";
import * as wild from "./scenes/wild.js";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, DrawSVGPlugin);
if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger }); // handy in the console

const scenes = { machine: { ...machine, loop: true }, choice, score, noul, parallel, thinking, gates, wild };

// The 3D scenes paint their floor type onto canvas textures, and the SVG scenes
// measure text. Both need the real fonts, so ask for each face and wait.
const faces = ['900 40px "Big Shoulders Display"', '400 16px "JetBrains Mono Variable"', '600 16px "JetBrains Mono Variable"'];

Promise.all(faces.map((face) => document.fonts.load(face)))
  .then(() => document.fonts.ready)
  .then(() => {
    for (const el of document.querySelectorAll("[data-scene]")) mount(el, scenes[el.dataset.scene]);

    // The index marks the sheet you are reading.
    const index = document.querySelector(".index");
    const links = [...index.querySelectorAll("a")];
    const setCurrent = (id) =>
      links.forEach((link) => {
        const current = link.hash === `#${id}`;
        link.classList.toggle("current", current);
        link.toggleAttribute("aria-current", current);
        // On a phone the index scrolls sideways, so keep the current sheet in view.
        if (current && index.scrollWidth > index.clientWidth) index.scrollTo({ left: link.offsetLeft - 24, behavior: reduceMotion ? "auto" : "smooth" });
      });
    for (const sheet of document.querySelectorAll(".sheet")) {
      ScrollTrigger.create({
        trigger: sheet,
        start: "top 45%",
        end: "bottom 45%",
        onToggle: ({ isActive }) => isActive && setCurrent(sheet.id),
      });
    }

    if (reduceMotion) return;

    for (const element of document.querySelectorAll("h1, .opening-text > *")) {
      gsap.from(element, { autoAlpha: 0, y: 18, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 82%", once: true } });
    }
    for (const group of document.querySelectorAll(".reveal-group")) {
      gsap.from(group.children, { autoAlpha: 0, y: 16, duration: 0.5, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: group, start: "top 82%", once: true } });
    }

    ScrollTrigger.refresh();
  });
