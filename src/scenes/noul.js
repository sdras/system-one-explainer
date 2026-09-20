import { gsap } from "gsap";
import { createStage, PALETTE, Group, MONO } from "../lib/stage3d.js";
import { reduceMotion } from "../lib/scene.js";
export const markup=`<div class="instrument-heading">Setting a decision threshold</div><div class="viewport viewport-noul"></div><pre class="readout" aria-live="polite"><span class="k">estimatedProbability</span> <span class="n" data-out="noul">1.000</span>
<span class="muted">const</span> urgent = estimatedProbability >= <span class="n" data-out="threshold">0.90</span> <span class="muted">//</span> <strong data-out="verdict">true</strong></pre><div class="controls"><div class="sliders"><label><span class="mono">probability</span><span class="muted">simulated probability</span><input type="range" min="0" max="1" step="0.001" value="1" data-in="noul"></label><label><span class="mono">threshold</span><span class="muted">decision cutoff</span><input type="range" min="0" max="1" step="0.01" value="0.9" data-in="threshold"></label></div><p class="control-note">The illuminated sector marks values that pass the cutoff. Move either control to change the boolean result.</p></div>`;
export function build(el){
 const s=createStage(el.querySelector('.viewport'),{bounds:{x:[-185,185],y:[-170,120],z:90},label:'A three-dimensional probability dial. A luminous needle shows the probability; a raised amber marker sets the decision threshold. Values and boolean result are printed below.'});
 s.disc({x:0,y:0,r:162,h:12,color:PALETTE.belt});
 s.disc({x:0,y:0,z:12,r:149,h:7,color:PALETTE.block});
 s.ring({x:0,y:0,z:20,r:150,tube:1.5,color:PALETTE.noul});
 s.ring({x:0,y:0,z:21,r:103,tube:0.8,color:PALETTE.muted,opacity:0.4});
 const position=(p,r)=>{const a=Math.PI*(1-p);return [Math.cos(a)*r,-Math.sin(a)*r];};
 const ticks=Array.from({length:51},(_,i)=>{const [x,y]=position(i/50,132);const mesh=s.box({x:x-1,y:y-3,z:21,w:2,d:i%5===0?12:6,h:i%5===0?3:1.5,color:PALETTE.noul,glow:true});mesh.rotation.y=Math.PI*(i/50);return mesh;});
 const needle=new Group();s.scene.add(needle);needle.position.y=29;
 s.box({x:0,y:-2,w:120,d:4,h:3,color:PALETTE.noul,glow:true,parent:needle,anchor:'left'});
 s.orb({x:116,y:0,z:2,r:4,color:PALETTE.noul,parent:needle});
 s.disc({x:0,y:0,z:22,r:13,h:14,color:PALETTE.paper});
 const marker=s.orb({x:0,y:0,z:44,r:6,color:PALETTE.score});
 const stem=s.box({x:0,y:0,z:20,w:3,d:3,h:24,color:PALETTE.score,glow:true});
 const value=s.label('1.000',{x:0,y:66,z:21,size:35,color:PALETTE.paper,align:'center',family:MONO,weight:600});
 s.label('PROBABILITY',{x:0,y:91,z:21,size:10,color:PALETTE.muted,align:'center',family:MONO});
 s.label('0',{x:-127,y:31,z:22,size:16,color:PALETTE.paper,family:MONO});s.label('1',{x:126,y:31,z:22,size:16,color:PALETTE.paper,family:MONO});
 const view={noul:1,threshold:0.9};
 el.addEventListener("animation-stop",()=>gsap.killTweensOf(view));
 function draw(){needle.rotation.y=Math.PI*(1-view.noul);const [x,y]=position(view.threshold,132);marker.position.set(x,44,y);stem.position.set(x,20,y);ticks.forEach((t,i)=>{t.material.color.set(i/50>=view.threshold?'#addb67':PALETTE.noul);t.material.opacity=i/50>=view.threshold?1:0.25;t.material.transparent=true;});s.setText(value,view.noul.toFixed(3));el.querySelector('[data-out=noul]').textContent=view.noul.toFixed(3);el.querySelector('[data-out=threshold]').textContent=view.threshold.toFixed(2);el.querySelector('[data-out=verdict]').textContent=String(view.noul>=view.threshold);el.classList.toggle('is-yes',view.noul>=view.threshold);}
 for(const name of ['noul','threshold'])el.querySelector(`[data-in=${name}]`).addEventListener('input',e=>gsap.to(view,{[name]:Number(e.target.value),duration:reduceMotion?0:0.25,onUpdate:draw,overwrite:true}));
 draw();return gsap.timeline({paused:true}).call(()=>{view.noul=1;view.threshold=0.9;el.querySelector('[data-in=noul]').value=1;el.querySelector('[data-in=threshold]').value=0.9;draw();},null,0.02);
}
