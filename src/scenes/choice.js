import { gsap } from "gsap";
import { createStage, PALETTE, MONO } from "../lib/stage3d.js";
import { reduceMotion } from "../lib/scene.js";
const OPTIONS=['billing','technical','sales'];
const PRESETS=[{name:'Clear preference',p:[0.15,0.85,0],confidence:null},{name:'Ambiguous example',p:[0.45,0.45,0.1],confidence:null},{name:'Sales example',p:[0.05,0.1,0.85],confidence:null}];
export const markup=`<div class="instrument-heading">Three possible interpretations</div><div class="viewport viewport-choice"></div><div class="choice-summary" aria-live="polite"></div><div class="controls"><div class="presets">${PRESETS.map((p,i)=>`<button type="button" data-choice="${i}" aria-pressed="${i===0}">${p.name}</button>`).join('')}</div><p class="control-note">Switch distributions to compare a clear preference with a tie. All presets are illustrative probability distributions.</p></div>`;
export function build(el){
 const s=createStage(el.querySelector('.viewport'),{bounds:{x:[-85,455],y:[-65,135],z:230},label:'Three probability towers. Height represents probability; selecting a preset changes the distribution. Exact values appear below.'});
 const columns=[],caps=[],labels=[],halos=[];
 OPTIONS.forEach((name,i)=>{const x=i*180;
  s.disc({x,y:0,r:58,h:9,color:PALETTE.belt});
  halos.push(s.ring({x,y:0,z:11,r:56,tube:1.4,color:PALETTE.choice}));
  columns.push(s.box({x:x-26,y:-26,z:12,w:52,d:52,h:1,color:PALETTE.choice}));
  caps.push(s.box({x:x-28,y:-28,z:14,w:56,d:56,h:2,color:PALETTE.noul,glow:true}));
  labels.push(s.label('0%',{x,y:15,z:20,size:24,align:'center',color:PALETTE.ink,family:MONO,weight:600}));
  s.label(name,{x,y:100,size:21,align:'center',color:PALETTE.paper,family:MONO,weight:500});
  for(let j=1;j<=4;j++)s.ring({x,y:0,z:12+j*45,r:37,tube:0.45,color:PALETTE.muted,opacity:0.22});
 });
 const view={a:0,b:0,c:0}; let selected=0;
 el.addEventListener("animation-stop",()=>gsap.killTweensOf(view));
 function paint(){[view.a,view.b,view.c].forEach((p,i)=>{columns[i].scale.y=Math.max(p*180,0.001);caps[i].position.y=13+p*180;labels[i].userData.z=16+p*180;s.setText(labels[i],`${Math.round(p*100)}%`);halos[i].material.opacity=p===Math.max(view.a,view.b,view.c)?1:0.2;});}
 function select(i,{animate=true}={}){selected=i;const preset=PRESETS[i];const target={a:preset.p[0],b:preset.p[1],c:preset.p[2]};
 if(reduceMotion){Object.assign(view,target);paint();}
 else if(animate)gsap.to(view,{...target,duration:0.9,ease:'power3.inOut',onUpdate:paint,overwrite:true});
 else paint();
 el.querySelector('.choice-summary').innerHTML=`${OPTIONS.map((name,j)=>`<span>${name}<strong>${preset.p[j].toFixed(2)}</strong></span>`).join('')}`;
 el.querySelectorAll('[data-choice]').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
 }
 el.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.choice))));
 // Fill the readout now; grow the towers only when the scene enters view.
 select(0,{animate:false});
 return gsap.timeline({paused:true}).call(()=>select(selected),null,0.02);
}
