import { gsap } from "gsap";
import { createStage, PALETTE, MONO } from "../lib/stage3d.js";
import { reduceMotion } from "../lib/scene.js";
const examples=[{name:'Recognize a familiar word',prompt:'APPLE',steps:['letters','familiar pattern','recognition'],result:'A familiar word can be recognized without consciously checking every letter.',mode:0},{name:'Check a calculation',prompt:'17 × 24',steps:['17 × 20 = 340','17 × 4 = 68','340 + 68 = 408'],result:'Breaking the calculation into parts exposes intermediate results that can be checked.',mode:1}];
export const markup=`<div class="instrument-heading">Recognition and checking</div><div class="viewport viewport-thinking"></div><div class="thinking-summary" aria-live="polite"></div><div class="controls"><div class="presets">${examples.map((e,i)=>`<button type="button" data-thinking="${i}" aria-pressed="${i===0}">${e.name}</button>`).join('')}</div><p class="control-note">Animation timing is for illustration. Familiarity and practice can change how a task is approached.</p></div>`;
export function build(el){
 const s=createStage(el.querySelector('.viewport'),{bounds:{x:[-80,480],y:[-80,200],z:130},label:'Two conceptual paths: a direct route for recognition and a sequence of three checkpoints for deliberate calculation. Select an example to see its steps.'});
 const direct=s.path([[0,0,36],[200,0,90],[400,0,36]],PALETTE.noul,2);
 const checked=s.path([[0,140,36],[130,140,36],[270,140,36],[400,140,36]],PALETTE.score,2);
 const pads=[];
 [0,200,400].forEach((x,i)=>{
  s.disc({x,y:0,r:32,h:9,color:PALETTE.belt});s.ring({x,y:0,z:10,r:32,color:PALETTE.noul});
  s.disc({x,y:140,r:32,h:9,color:PALETTE.belt});pads.push(s.ring({x,y:140,z:10,r:32,color:PALETTE.score}));
 });
 s.label('RECOGNITION',{x:200,y:-55,size:20,color:PALETTE.noul,align:'center',family:MONO});
 s.label('DELIBERATE CHECKS',{x:200,y:205,size:20,color:PALETTE.score,align:'center',family:MONO});
 const pulse=s.orb({x:0,y:0,z:36,r:8,color:PALETTE.noul});const view={t:0};let active; let selected=0;
 el.addEventListener("animation-stop",()=>active?.pause());
 function choose(i,{animate=true}={}){selected=i;const e=examples[i];active?.kill();const curve=i?checked:direct;
 el.querySelector('.thinking-summary').innerHTML=`<strong>${e.prompt}</strong><ol>${e.steps.map(t=>`<li>${t}</li>`).join('')}</ol><p>${e.result}</p>`;
 el.querySelectorAll('[data-thinking]').forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
 const paint=()=>{pulse.position.copy(curve.getPoint(view.t));pads.forEach((p,j)=>p.material.opacity=i&&view.t>=j/2?1:0.2);};
 view.t=reduceMotion?1:0;paint();
 if(animate&&!reduceMotion)active=gsap.to(view,{t:1,duration:i?2.8:1,ease:i?'steps(12)':'power2.inOut',onUpdate:paint});
 }
 el.querySelectorAll('[data-thinking]').forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.thinking))));
 // Populate the explanation and starting pose without running the intro.
 choose(0,{animate:false});return gsap.timeline({paused:true}).call(()=>choose(selected),null,0.02);
}
