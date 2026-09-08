import { CHAPTERS, drawScene } from './scene-renderer.mjs';
const canvas=document.getElementById('project-canvas');
const context=canvas?.getContext('2d');
const theatre=document.getElementById('project-cinema');
const toggle=document.getElementById('cinema-toggle');
const buttons=[...document.querySelectorAll('[data-chapter]')];
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const photo=new Image();photo.src='../assets/hank-portrait.jpg';
let width=0,height=0,index=0,previous=0,elapsed=0,transition=1,previousTime=0;
let playing=!reduced.matches,visible=true,frame=null,last=0;
const duration=14;
function isAllowed(){return playing&&visible&&!document.hidden&&!document.body.classList.contains('motion-paused')&&!reduced.matches}
function describe(){
  const ch=CHAPTERS[index];
  document.getElementById('cinema-category').textContent=ch.category;
  document.getElementById('cinema-title').textContent=ch.title;
  document.getElementById('cinema-description').textContent=ch.description;
  document.getElementById('cinema-note').textContent=ch.note;
  document.getElementById('cinema-counter').textContent=`0${index+1} / 04`;
  canvas?.setAttribute('aria-label',ch.alt);
  buttons.forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===index));b.style.setProperty('--chapter-progress',i<index?'100%':'0%')});
  const cap=theatre.querySelector('.cinema-caption');cap.classList.remove('caption-change');requestAnimationFrame(()=>cap.classList.add('caption-change'));
}
function draw(){
  if(!context||!width||!height)return;
  context.clearRect(0,0,width,height);
  if(transition<1&&previous!==index){context.save();context.globalAlpha=1-transition;drawScene(context,width,height,previousTime,previous,photo);context.restore()}
  context.save();context.globalAlpha=transition;drawScene(context,width,height,elapsed,index,photo);context.restore();
  buttons[index].style.setProperty('--chapter-progress',`${Math.min(100,elapsed/duration*100)}%`);
}
function select(next,manual=false){previous=index;previousTime=elapsed;index=next;elapsed=0;transition=manual&&(!isAllowed())?1:0;describe();draw()}
function updateToggle(){const blocked=document.body.classList.contains('motion-paused')||reduced.matches;toggle.textContent=playing&&!blocked?'Ⅱ':'▶';toggle.setAttribute('aria-label',playing&&!blocked?'Pause project animation':'Play project animation');toggle.setAttribute('aria-pressed',String(playing&&!blocked));toggle.disabled=blocked;toggle.title=blocked?'Use the page motion control. Animations stay still when your system requests reduced motion.':''}
function loop(time){
  if(!isAllowed()){frame=null;last=0;return}
  const dt=last?Math.min((time-last)/1000,.05):0;last=time;elapsed+=dt;transition=Math.min(1,transition+dt/1.05);
  if(elapsed>=duration)select((index+1)%CHAPTERS.length);
  draw();frame=requestAnimationFrame(loop);
}
function sync(){updateToggle();if(isAllowed()){if(frame===null){last=0;frame=requestAnimationFrame(loop)}}else{if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;transition=1;draw()}}
function resize(){if(!context)return;const box=canvas.parentElement.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(window.devicePixelRatio||1,1.75);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);context.setTransform(dpr,0,0,dpr,0,0);draw()}
toggle.addEventListener('click',()=>{playing=!playing;sync()});
buttons.forEach(b=>b.addEventListener('click',()=>{select(Number(b.dataset.chapter),true);sync()}));
new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
reduced.addEventListener('change',()=>{playing=!reduced.matches;sync()});
document.addEventListener('visibilitychange',sync);
if('IntersectionObserver'in window){new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()},{threshold:.03}).observe(theatre)}
if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas.parentElement);else window.addEventListener('resize',resize);
photo.addEventListener('load',draw);
describe();resize();sync();
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('campus-visible');observer.unobserve(e.target)}},{threshold:.12});for(const card of document.querySelectorAll('.campus-card,.life-photo-stage,.life-copy'))observer.observe(card)}
