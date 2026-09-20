// A small isometric three.js stage. Scenes describe things the way the design
// mock did: x runs to the lower right, y (depth) to the lower left, z is up.
// three.js is y-up, so everything here maps (x, y, z) -> (x, z, y).
import {
  Box3,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  TorusGeometry,
  SphereGeometry,
  CatmullRomCurve3,
  TubeGeometry,
  AdditiveBlending,
  PCFSoftShadowMap,
  ACESFilmicToneMapping,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const PALETTE = {
  belt: "#123550",
  block: "#1a4b6e",
  paper: "#d6deeb",
  paperInk: "#7b8da3",
  plank: "#9fb0c4",
  ink: "#011627",
  grid: "#24506f",
  floorText: "#2b587a",
  muted: "#8ba3b8",
  choice: "#82aaff",
  score: "#ecc48d",
  noul: "#7fdbca",
  bolt: "#ecc48d",
};

export { Color, Group };

export const DISPLAY = '"Big Shoulders Display"';
export const MONO = '"JetBrains Mono Variable"';

const ISO = new Vector3(1, 1, 1).normalize();
const TEXEL = 4; // texture pixels per scene unit, for floor text
const BOLT = [[72, 14], [28, 72], [58, 72], [52, 114], [100, 54], [70, 54]];

/**
 * @param {HTMLElement} container  sized by CSS; the canvas fills it
 * @param {object} options         bounds: { x: [min, max], y: [min, max], z: height }, label, grid step
 */
export function createStage(container, { bounds, label: accessibleLabel, step = 60 }) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", accessibleLabel);
  container.append(renderer.domElement);

  const scene = new Scene();
  const box3 = new Box3(new Vector3(bounds.x[0], 0, bounds.y[0]), new Vector3(bounds.x[1], bounds.z, bounds.y[1]));
  const center = box3.getCenter(new Vector3());
  const size = box3.getSize(new Vector3());

  // True isometric: an orthographic camera looking down the (1, 1, 1) diagonal.
  const camera = new OrthographicCamera(-1, 1, 1, -1, 1, 6000);
  camera.position.copy(center).addScaledVector(ISO, 2500);
  camera.lookAt(center);

  // One sun, angled so a box shows three tones: top lightest, left face mid, right face darkest.
  scene.add(new HemisphereLight("#cfe0ff", "#010e1a", 1.25));
  const sun = new DirectionalLight("#ffffff", 2.4);
  sun.position.copy(center).add(new Vector3(0.35, 1, 0.7).multiplyScalar(1400));
  sun.target.position.copy(center);
  sun.castShadow = true;
  const span = Math.max(size.x, size.z) * 0.75;
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 5000 });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 5;
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);

  const ground = new Mesh(new PlaneGeometry(size.x * 4, size.z * 4), new ShadowMaterial({ opacity: 0.38 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(center.x, 0, center.z);
  ground.receiveShadow = true;
  scene.add(ground);

  // The floor grid runs on well past the scene and fades with distance, so a wide
  // panel reads as a slice of one big floor instead of a diamond in a void.
  const reach = Math.max(size.x, size.z) * 1.4;
  const fade = (x, y) => {
    const dx = Math.max(bounds.x[0] - x, 0, x - bounds.x[1]);
    const dy = Math.max(bounds.y[0] - y, 0, y - bounds.y[1]);
    return Math.max(0, 1 - Math.hypot(dx, dy) / reach) ** 2;
  };
  const snap = (value) => Math.round(value / step) * step;
  const [x0, x1, y0, y1] = [snap(bounds.x[0] - reach), snap(bounds.x[1] + reach), snap(bounds.y[0] - reach), snap(bounds.y[1] + reach)];
  const ink = new Color(PALETTE.grid);
  const positions = [];
  const colors = [];
  const segment = (ax, ay, bx, by) => {
    positions.push(ax, 0, ay, bx, 0, by);
    colors.push(ink.r, ink.g, ink.b, fade(ax, ay), ink.r, ink.g, ink.b, fade(bx, by));
  };
  for (let x = x0; x <= x1; x += step) for (let y = y0; y < y1; y += step) segment(x, y, x, y + step);
  for (let y = y0; y <= y1; y += step) for (let x = x0; x < x1; x += step) segment(x, y, x + step, y);
  const gridGeometry = new BufferGeometry();
  gridGeometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  gridGeometry.setAttribute("color", new Float32BufferAttribute(colors, 4));
  scene.add(new LineSegments(gridGeometry, new LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false })));

  /** Fit the bounds inside whatever shape the container is. */
  function fit() {
    const { clientWidth: width, clientHeight: height } = container;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.updateMatrixWorld();
    const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    let [minX, maxX, minY, maxY] = [Infinity, -Infinity, Infinity, -Infinity];
    for (const x of [box3.min.x, box3.max.x])
      for (const y of [box3.min.y, box3.max.y])
        for (const z of [box3.min.z, box3.max.z]) {
          const corner = new Vector3(x, y, z).sub(camera.position);
          minX = Math.min(minX, corner.dot(right));
          maxX = Math.max(maxX, corner.dot(right));
          minY = Math.min(minY, corner.dot(up));
          maxY = Math.max(maxY, corner.dot(up));
        }
    let w = maxX - minX;
    let h = maxY - minY;
    if (w / h > width / height) h = w / (width / height);
    else w = h * (width / height);
    Object.assign(camera, { left: (minX + maxX - w) / 2, right: (minX + maxX + w) / 2, top: (minY + maxY + h) / 2, bottom: (minY + maxY - h) / 2 });
    camera.updateProjectionMatrix();
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
  container.addEventListener("pointermove", (event) => {
    if (reduced || event.pointerType === "touch") return;
    const rect = container.getBoundingClientRect();
    aim.x = (event.clientX - rect.left) / rect.width - 0.5;
    aim.y = (event.clientY - rect.top) / rect.height - 0.5;
  });
  container.addEventListener("pointerleave", () => { aim.x = aim.y = 0; });
  const updates = [];
  let motionStopped = false;
  const host = container.closest(".stage");
  host?.addEventListener("animation-stop", () => { motionStopped = true; });
  host?.addEventListener("animation-replay", () => { motionStopped = false; });
  host?.addEventListener("input", () => { motionStopped = false; });
  host?.addEventListener("click", (event) => {
    if (event.target.closest(".presets button")) motionStopped = false;
  });
  const render = () => {
    if (!motionStopped) {
    pointer.x += (aim.x - pointer.x) * 0.055;
    pointer.y += (aim.y - pointer.y) * 0.055;
    camera.position.copy(center).addScaledVector(ISO, 2500);
    camera.position.x += pointer.x * 150;
    camera.position.z -= pointer.x * 150;
    camera.position.y += pointer.y * 100;
    camera.lookAt(center);
    updates.forEach(fn => fn(reduced ? 0 : performance.now() / 1000));
    }
    renderer.render(scene, camera);
  };

  // Draw only while the stage is on screen.
  let running = false;
  ScrollTrigger.create({
    trigger: container,
    start: "top bottom",
    end: "bottom top",
    onToggle: ({ isActive }) => {
      if (isActive === running) return;
      running = isActive;
      gsap.ticker[isActive ? "add" : "remove"](render);
    },
  });
  new ResizeObserver(() => (fit(), render())).observe(container);
  fit();

  const lambert = (color) => new MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.38 });
  const place = (mesh, parent, shadow = true) => {
    mesh.castShadow = mesh.receiveShadow = shadow;
    (parent ?? scene).add(mesh);
    return mesh;
  };

  /** A box standing on (x, y) at height z. Its origin is its base, so scale.y is its height. */
  function box({ x, y, z = 0, w, d, h, color, parent, glow = false, anchor = "center" }) {
    const geometry = new BoxGeometry(w, 1, d);
    geometry.translate(anchor === "left" ? w / 2 : 0, 0.5, 0);
    const mesh = new Mesh(geometry, glow ? new MeshBasicMaterial({ color }) : lambert(color));
    mesh.position.set(anchor === "left" ? x : x + w / 2, z, y + d / 2);
    mesh.scale.y = Math.max(h, 0.001);
    return place(mesh, parent, !glow);
  }

  /** A triangular prism: apex above x, running from y to y + d. */
  function wedge({ x, y, w, d, h, color, parent }) {
    const shape = new Shape([new Vector2(-w / 2, 0), new Vector2(w / 2, 0), new Vector2(0, h)]);
    const mesh = new Mesh(new ExtrudeGeometry(shape, { depth: d, bevelEnabled: false }), lambert(color));
    mesh.position.set(x, 0, y);
    return place(mesh, parent);
  }

  function disc({ x, y, z = 0, r, h, color, parent }) {
    const mesh = new Mesh(new CylinderGeometry(r, r, h, 64), lambert(color));
    mesh.position.set(x, z + h / 2, y);
    return place(mesh, parent);
  }

  /** The Jev bolt, lying flat at height z with its 128-unit box scaled by k. */
  function bolt({ x, y, z, k, color = PALETTE.bolt, parent }) {
    const shape = new Shape(BOLT.map(([px, py]) => new Vector2(px * k, -py * k)));
    const mesh = new Mesh(new ShapeGeometry(shape), new MeshBasicMaterial({ color }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, z + 0.4, y);
    (parent ?? scene).add(mesh);
    return mesh;
  }

  /**
   * Type painted on a horizontal surface. (x, y) is the start of the baseline,
   * which runs along x. Returns a mesh; change its words with setText().
   */
  function label(text, { x, y, z = 0, size = 30, color = PALETTE.floorText, family = DISPLAY, weight = 900, align = "left", parent }) {
    const canvas = document.createElement("canvas");
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const mesh = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.userData = { canvas, texture, x, y, z, size, color, family, weight, align };
    (parent ?? scene).add(mesh);
    setText(mesh, text);
    return mesh;
  }

  /** Repaints only when the words change. Always re-places, so userData.x / y can be moved freely. */
  function setText(mesh, text) {
    const data = mesh.userData;
    if (data.text !== text) {
      data.text = text;
      const context = data.canvas.getContext("2d");
      const font = `${data.weight} ${data.size * TEXEL}px ${data.family}, sans-serif`;
      context.font = font;
      const width = Math.ceil(context.measureText(text).width) + 2 * TEXEL;
      const height = Math.ceil(data.size * TEXEL * 1.35);
      data.canvas.width = width;
      data.canvas.height = height;
      context.font = font;
      context.fillStyle = data.color;
      context.fillText(text, TEXEL, data.size * TEXEL);
      data.texture.dispose(); // the canvas changed size, so the GPU copy has to be rebuilt
      data.texture.needsUpdate = true;
      [data.w, data.h] = [width / TEXEL, height / TEXEL];
      mesh.scale.set(data.w, data.h, 1);
    }
    const left = data.align === "center" ? data.x - data.w / 2 : data.align === "right" ? data.x - data.w : data.x - 1;
    mesh.position.set(left + data.w / 2, data.z + 0.3, data.y - data.size + data.h / 2);
  }

  function ring({ x, y, z = 0, r, tube = 1, color, parent, opacity = 1 }) {
    const mesh = new Mesh(new TorusGeometry(r, tube, 8, 96), new MeshBasicMaterial({ color, transparent: true, opacity }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, z, y);
    (parent ?? scene).add(mesh);
    return mesh;
  }
  function orb({ x, y, z = 0, r = 4, color, parent }) {
    const group = new Group();
    group.position.set(x, z, y);
    group.add(new Mesh(new SphereGeometry(r, 16, 12), new MeshBasicMaterial({ color })));
    group.add(new Mesh(new SphereGeometry(r * 2.5, 16, 12), new MeshBasicMaterial({ color, transparent: true, opacity: 0.09, depthWrite: false, blending: AdditiveBlending })));
    (parent ?? scene).add(group);
    return group;
  }
  function path(points, color, radius = 1.2) {
    const curve = new CatmullRomCurve3(points.map(([x,y,z]) => new Vector3(x,z,y)));
    const mesh = new Mesh(new TubeGeometry(curve, 64, radius, 6, false), new MeshBasicMaterial({ color, transparent: true, opacity: 0.35 }));
    scene.add(mesh);
    return curve;
  }
  return { scene, camera, render, fit, box, wedge, disc, bolt, label, setText, ring, orb, path, updates };
}

/** A support ticket: a sheet of paper with five lines of writing. The group is centred on (x, y), so it scales in place. */
export function makeTicket(stage, { x, y, z }) {
  const ticket = new Group();
  ticket.position.set(x, 0, y);
  stage.scene.add(ticket);
  stage.box({ x: -40, y: -48, z, w: 80, d: 96, h: 4, color: PALETTE.paper, parent: ticket });
  [58, 50, 58, 38, 52].forEach((w, i) => stage.box({ x: -30, y: -36 + i * 15, z: z + 4, w, d: 5, h: 0.6, color: PALETTE.paperInk, parent: ticket }));
  return ticket;
}
