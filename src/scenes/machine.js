import { gsap } from "gsap";
import { createStage, PALETTE, MONO } from "../lib/stage3d.js";
import { reduceMotion } from "../lib/scene.js";

export const markup = `<div class="viewport viewport-machine"></div><div class="machine-readouts"><div><span>Category</span><strong>technical</strong><small>probability 0.85</small></div><div><span>Rating</span><strong>1.00</strong><small>on a 0–2 rubric</small></div><div><span>Probability</span><strong>1.00</strong><small>probability of yes</small></div></div><div class="instrument-footer"><span>Three questions about the same input</span><button type="button" class="motion-toggle" aria-pressed="false">Pause motion</button></div>`;

export function build(el) {
  const s = createStage(el.querySelector('.viewport'), { bounds: { x: [-300, 340], y: [-190, 210], z: 230 }, label: 'A luminous central processor connects one input to three independent output instruments. Orbiting lights represent evaluation, not a brain or a particular model architecture.' });
  const colors = [PALETTE.choice, PALETTE.score, PALETTE.noul];
  s.disc({ x: 0, y: 0, r: 103, h: 12, color: PALETTE.belt });
  s.disc({ x: 0, y: 0, z: 12, r: 78, h: 18, color: PALETTE.block });
  [84, 101, 118].forEach((r,i) => s.ring({ x: 0, y: 0, z: 15 + i*2, r, color: colors[i], opacity: 0.6 }));
  const rings = colors.map((color,i) => {
    const ring = s.ring({x:0,y:0,z:105,r:61+i*13,tube:1.5,color});
    ring.rotation.set(0.6+i*0.6, i*0.8, i*0.4);
    return ring;
  });
  const core = s.orb({x:0,y:0,z:105,r:23,color:PALETTE.noul});
  s.label('EVALUATE', {x:0,y:54,z:31,size:17,color:PALETTE.paper,align:'center'});
  const lanes = [-138, 0, 138];
  const trails = lanes.map((y,i) => s.path([[-280,y,25],[-175,y,35],[-115,y*0.45,70],[-45,0,105]],colors[i]));
  const outbound = lanes.map((y,i) => s.path([[45,0,105],[140,y*0.5,65],[200,y,32],[290,y,32]],colors[i]));
  lanes.forEach((y,i) => {
    s.box({x:-298,y:y-22,z:6,w:65,d:44,h:12,color:PALETTE.belt});
    s.box({x:-285,y:y-13,z:18,w:39,d:26,h:3,color:colors[i],glow:true});
    s.disc({x:270,y,z:2,r:44,h:10,color:PALETTE.belt});
    s.ring({x:270,y,z:13,r:40,color:colors[i],tube:1.2});
    if (i===0) [0.15,0.85,0].forEach((p,j) => s.box({x:246+j*18,y:y-9,z:13,w:12,d:18,h:Math.max(2,p*75),color:colors[i]}));
    if (i===1) { s.box({x:240,y:y-5,z:36,w:60,d:10,h:5,color:colors[i]}); s.wedge({x:270,y:y-15,w:18,d:30,h:36,color:PALETTE.plank}); }
    if (i===2) { s.ring({x:270,y,z:18,r:27,color:colors[i]}); s.box({x:270,y:y-2,z:20,w:24,d:4,h:3,color:colors[i],glow:true}); }
  });
  const streams = [...trails,...outbound].flatMap((curve,i) => Array.from({length:5},(_,j) => ({curve,phase:j/5+i*0.08,orb:s.orb({x:0,y:0,z:0,r:3,color:colors[i%3]})})));
  let paused=reduceMotion, elapsed=0, last=0;
  const button=el.querySelector('.motion-toggle');
  button.textContent=paused?'Play motion':'Pause motion'; button.setAttribute('aria-pressed',String(paused));
  button.addEventListener('click',()=>{paused=!paused;button.textContent=paused?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));});
  s.updates.push((time)=>{
    const dt=last ? Math.min(time-last,0.05):0;last=time;
    if(!paused) elapsed+=dt;
    rings.forEach((r,i)=>{r.rotation.y=elapsed*(0.16+i*0.045)+i*0.8;r.rotation.z=elapsed*0.12+i*0.4;});
    core.scale.setScalar(1+Math.sin(elapsed*1.8)*0.08);
    streams.forEach(({curve,phase,orb})=>orb.position.copy(curve.getPoint((elapsed*0.18+phase)%1)));
  });
  return gsap.timeline({paused:true}).fromTo(core.scale,{x:0.7,y:0.7,z:0.7},{x:1,y:1,z:1,duration:1.2});
}
