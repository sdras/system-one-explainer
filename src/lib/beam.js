// A Score, as a balance beam. Probabilities are weights standing on the levels,
// and the score is the point where the plank balances: the weighted mean.
// Change the weights and the plank tips first, then the fulcrum catches up.
import { gsap } from "gsap";
import { reduceMotion } from "./scene.js";
import { Group, MONO, PALETTE } from "./stage3d.js";

/**
 * @param {object} stage  from createStage()
 * @param {object} shape  x: where level 0 is, y: the beam's centre line (depth), spacing between levels,
 *                        plank { d, h, overhang }, wedge { w, d, h }, weight { size, tallest }, tags { size } (optional)
 */
export function createBeam(stage, { x, y, spacing, plank, wedge, weight, tags, onDraw }) {
  const view = { p0: 0, p1: 0, p2: 0, fulcrum: 1, tilt: 0 };
  const levels = [0, 1, 2].map((level) => x + level * spacing);
  const deck = wedge.h + plank.h;

  const fulcrum = stage.wedge({ x: 0, y: y - wedge.d / 2, ...wedge, color: PALETTE.score });
  // The pivot sits on the tip of the fulcrum and tilts. The rig undoes the pivot's
  // offset, so everything on the plank can be placed in ordinary stage coordinates.
  const pivot = new Group();
  const rig = new Group();
  pivot.add(rig);
  stage.scene.add(pivot);

  stage.box({ x: x - plank.overhang, y: y - plank.d / 2, z: wedge.h, w: 2 * spacing + 2 * plank.overhang, d: plank.d, h: plank.h, color: PALETTE.plank, parent: rig });
  const weights = levels.map((lx) => stage.box({ x: lx - weight.size / 2, y: y - weight.size / 2, z: deck, w: weight.size, d: weight.size, h: 0, color: PALETTE.score, parent: rig }));
  const labels = tags ? levels.map((lx) => stage.label("0.00", { x: lx, y: y + tags.size * 0.36, size: tags.size, color: PALETTE.ink, family: MONO, weight: 600, align: "center", parent: rig })) : [];

  const scoreOf = (p) => (p[0] + p[1] + p[2] ? (p[1] + 2 * p[2]) / (p[0] + p[1] + p[2]) : 1);

  function draw() {
    const ps = [view.p0, view.p1, view.p2];
    const tip = x + view.fulcrum * spacing;
    fulcrum.position.x = tip;
    pivot.position.set(tip, wedge.h, 0);
    rig.position.set(-tip, -wedge.h, 0);
    pivot.rotation.z = view.tilt;
    ps.forEach((p, i) => {
      weights[i].scale.y = Math.max(p * weight.tallest, 0.001);
      weights[i].visible = p > 0.004;
      if (!labels[i]) return;
      stage.setText(labels[i], p.toFixed(2));
      labels[i].position.y = deck + p * weight.tallest + 0.4;
    });
    onDraw?.({ ps, fulcrum: view.fulcrum, tip });
  }

  /** Move to a new distribution. Returns the timeline, so a bigger timeline can hold it. */
  function to(p, { duration = 0.8, interrupt = true, leanFrom = view.fulcrum } = {}) {
    const score = scoreOf(p);
    // A slider drag interrupts whatever was playing. A scripted sequence must not.
    if (interrupt) gsap.killTweensOf(view);
    if (reduceMotion) {
      Object.assign(view, { p0: p[0], p1: p[1], p2: p[2], fulcrum: score, tilt: 0 });
      draw();
      return gsap.timeline();
    }
    // Heavier to the right of the fulcrum means the right end drops: a negative turn about z.
    // (A scripted sequence is built before it plays, so it says where the fulcrum will be: leanFrom.)
    const lean = gsap.utils.clamp(-0.13, 0.13, (leanFrom - score) * 0.35);
    return gsap
      .timeline({ onUpdate: draw })
      .to(view, { p0: p[0], p1: p[1], p2: p[2], duration, ease: "power3.out" }, 0)
      .to(view, { tilt: lean, duration: 0.28, ease: "power2.out" }, 0)
      .to(view, { fulcrum: score, duration: duration * 1.1, ease: "power2.inOut" }, 0.18)
      .to(view, { tilt: 0, duration: 1.1, ease: "elastic.out(1, 0.45)" }, 0.3);
  }

  draw();
  return { view, draw, to, scoreOf, levels };
}
