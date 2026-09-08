// Conceptual scientific diagrams: geometric models, synthetic signals and example data.
export const CHAPTERS = [
  { category:'材料 / 透明电极', title:'一层薄膜，连接光与电。', description:'分层观察玻璃基底与透明薄膜，理解透光与导电的研究目标。', note:'概念动画 · 薄膜厚度放大示意，非真实样品或实测数据。', alt:'旋转的玻璃基底、放大显示的薄膜层、沉积粒子与透光路径示意。' },
  { category:'机器学习 / 材料建模', title:'把材料成分，变成可学习的信息。', description:'成分描述符汇成特征矩阵，再用于玻璃形成能力分类。', note:'概念动画 · 圆点表示抽象特征，非晶体结构；未运行真实模型。', alt:'抽象材料特征球体旋转并汇入矩阵，说明从成分到描述符与分类的过程。' },
  { category:'AI 应用 / 交易解析', title:'让一条消息，变成清晰的字段。', description:'消息自动拆解、字段逐一归位，缺失的信息保留为“需确认”。', note:'虚构消息与预设结果 · 用于说明处理思路，非公司系统或实时推理。', alt:'虚构交易消息的方向、产品与结算日期飞入结构化字段，金额保持待确认。' },
  { category:'视觉与信号 / 非接触心率', title:'从细微颜色变化，寻找脉搏信号。', description:'视频皮肤区域的颜色变化可形成时间序列，用于估计心率。', note:'照片仅用于区域示意；波形为合成 PPG 信号，未测量心率或调用摄像头。', alt:'以个人照片说明视频中的皮肤区域，右侧展示合成的平滑脉搏波形。' }
];
const TAU=Math.PI*2;
const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
const mix=(a,b,t)=>a+(b-a)*t;
function round(ctx,x,y,w,h,r=10){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function text(ctx,str,x,y,size=18,color='#60707d',align='left',weight=400){ctx.fillStyle=color;ctx.font=`${weight} ${size}px "PingFang SC","Microsoft YaHei",system-ui,sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(str,x,y)}
function line(ctx,points,color,width=1){ctx.beginPath();for(let i=0;i<points.length;i++){const p=points[i];i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()}
function shadow(ctx,x,y,w,h,alpha=.12){ctx.save();const g=ctx.createRadialGradient(x,y,0,x,y,w);g.addColorStop(0,`rgba(41,59,67,${alpha})`);g.addColorStop(1,'rgba(41,59,67,0)');ctx.translate(x,y);ctx.scale(1,h/w);ctx.fillStyle=g;ctx.translate(-x,-y);ctx.beginPath();ctx.arc(x,y,w,0,TAU);ctx.fill();ctx.restore()}
function projector(t,cx=357,cy=253,unit=91){const yaw=-.47+Math.sin(t*.25)*.19;const pitch=.47;return p=>{const x=p[0]*Math.cos(yaw)+p[2]*Math.sin(yaw);const z=-p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw);const y=p[1]*Math.cos(pitch)-z*Math.sin(pitch);const depth=p[1]*Math.sin(pitch)+z*Math.cos(pitch);const scale=8/(8-depth);return {x:cx+x*unit*scale,y:cy-y*unit*scale,z:depth,scale}}}
function slab(ctx,project,y,thickness,colors){const w=1.75,d=1.14;const raw=[[-w,y,-d],[w,y,-d],[w,y,d],[-w,y,d],[-w,y-thickness,-d],[w,y-thickness,-d],[w,y-thickness,d],[-w,y-thickness,d]];const p=raw.map(project);const faces=[{i:[4,5,6,7],c:colors[2]},{i:[0,1,5,4],c:colors[1]},{i:[1,2,6,5],c:colors[1]},{i:[2,3,7,6],c:colors[1]},{i:[3,0,4,7],c:colors[1]},{i:[0,1,2,3],c:colors[0]}];faces.sort((a,b)=>a.i.reduce((s,i)=>s+p[i].z,0)-b.i.reduce((s,i)=>s+p[i].z,0));for(const f of faces){ctx.beginPath();f.i.forEach((i,n)=>n?ctx.lineTo(p[i].x,p[i].y):ctx.moveTo(p[i].x,p[i].y));ctx.closePath();ctx.fillStyle=f.c;ctx.fill();ctx.strokeStyle='rgba(101,136,146,.38)';ctx.lineWidth=1;ctx.stroke()}return p}
function thinFilm(ctx,t){
  const project=projector(t);const phase=(t%13)/13;const lift=.15+.45*(.5+.5*Math.sin(t*.45));
  shadow(ctx,360,343,214,38,.10);
  const beamOpacity=.18+.22*(.5+.5*Math.sin(t*.8));
  for(let i=0;i<5;i++){const z=-.66+i*.28;line(ctx,[project([-2.3,2.7,z]),project([1.4,-1.55,z])],`rgba(218,163,105,${beamOpacity})`,1.8)}
  slab(ctx,project,-.20,.21,['rgba(213,231,229,.57)','rgba(147,182,190,.32)','rgba(226,239,238,.35)']);
  slab(ctx,project,.12+lift,.035,['rgba(229,202,176,.27)','rgba(192,110,60,.35)','rgba(245,223,196,.15)']);
  slab(ctx,project,.24+lift*1.35,.032,['rgba(226,238,242,.48)','rgba(130,163,180,.37)','rgba(230,243,245,.18)']);
  const sheen=[project([-1.53,.265+lift*1.35,-1.02]),project([1.52,.265+lift*1.35,-1.02])];line(ctx,sheen,'rgba(255,255,255,.9)',2.3);
  for(let i=0;i<29;i++){const a=i*2.399963;const r=.3+((i*17)%23)/23*1.3;const fall=((t*.2+i*.067)%1);const p=project([Math.cos(a)*r,.31+lift*1.35+(1-fall)*1.8,Math.sin(a)*r*.57]);ctx.fillStyle=`rgba(197,100,47,${.15+fall*.4})`;ctx.beginPath();ctx.arc(p.x,p.y,1.5+p.scale*.6,0,TAU);ctx.fill()}
  const filmPoint=project([1.63,.26+lift*1.35,-.5]);line(ctx,[filmPoint,{x:584,y:126},{x:652,y:126}],'#a7b7bd',1);text(ctx,'透明薄膜',648,108,17,'#657b84','right');
  const glassPoint=project([-1.4,-.22,.7]);line(ctx,[glassPoint,{x:104,y:300},{x:60,y:300}],'#a7b7bd',1);text(ctx,'玻璃基底',60,322,17,'#657b84');
  text(ctx,'沉积 · 分层 · 透光',360,388,17,'#879499','center');
}
function sphere(ctx,p,r,color){const g=ctx.createRadialGradient(p.x-r*.32,p.y-r*.38,r*.05,p.x,p.y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.25,color);g.addColorStop(1,'#697e86');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=.8;ctx.stroke()}
function materials(ctx,t){
  const cycle=(t%13)/13;const gather=ease((cycle-.24)/.42);const fade=ease((cycle-.78)/.18);const progress=gather*(1-fade);const project=projector(t,244,235,78);
  shadow(ctx,260,340,149,28,.10);shadow(ctx,542,337,145,25,.08);
  ctx.save();ctx.translate(508,218);ctx.rotate(-.04);ctx.shadowColor='rgba(43,57,67,.1)';ctx.shadowBlur=24;round(ctx,-101,-114,207,235,16);ctx.fillStyle='#f8fafb';ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#d9e2e6';ctx.lineWidth=1;ctx.stroke();text(ctx,'特征矩阵',2,-84,19,'#5c707e','center',600);
  for(let i=0;i<20;i++){const x=-67+(i%4)*43;const y=-40+Math.floor(i/4)*30;round(ctx,x,y,28,16,4);ctx.fillStyle=['#d9e3e7','#eed5c1','#c5d4dc','#e6edf0'][i%4];ctx.fill()}
  ctx.restore();
  const balls=[];for(let i=0;i<20;i++){const a=i*2.399963;const yy=1-2*(i+.5)/20;const rad=Math.sqrt(1-yy*yy);const p=project([Math.cos(a)*rad*1.42,yy*1.46,Math.sin(a)*rad*1.42]);const target={x:440+(i%4)*43,y:177+Math.floor(i/4)*30};const local=ease(clamp(progress*1.35-(i%5)*.075));balls.push({p:{x:mix(p.x,target.x,local),y:mix(p.y,target.y,local),z:p.z},r:mix(11+((i*5)%7),7,local),color:['#d28b56','#c5d6df','#a2b9c6','#e9c6a5'][i%4]})}
  balls.sort((a,b)=>a.p.z-b.p.z);for(const ball of balls)sphere(ctx,ball.p,ball.r,ball.color);
  text(ctx,'材料成分',240,367,18,'#657784','center');text(ctx,'描述符 → 分类',513,366,18,'#a55d30','center');
  for(let i=0;i<3;i++){const x=344+i*20;const opacity=.15+.35*(.5+.5*Math.sin(t*2-i));line(ctx,[{x,y:205},{x:x+8,y:214},{x,y:223}],`rgba(151,115,90,${opacity})`,1.5)}
}
function message(ctx,t){
  const cycle=(t%13)/13;shadow(ctx,357,347,265,33,.08);
  ctx.save();ctx.translate(211,213);ctx.rotate(-.065+Math.sin(t*.6)*.012);ctx.shadowColor='rgba(48,63,73,.12)';ctx.shadowBlur=22;ctx.shadowOffsetY=13;round(ctx,-135,-125,258,258,14);ctx.fillStyle='#fff';ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#d5dee3';ctx.stroke();text(ctx,'虚构交易消息',-108,-90,17,'#80909b');text(ctx,'买入示例债券A',-107,-39,23,'#324a59','left',600);text(ctx,'9月15日结算。',-107,1,23,'#324a59','left',600);for(let i=0;i<3;i++){round(ctx,-107,47+i*19,150-i*28,5,2);ctx.fillStyle='#e4e9ec';ctx.fill()}ctx.restore();
  ctx.save();ctx.shadowColor='rgba(48,63,73,.07)';ctx.shadowBlur=22;round(ctx,437,83,230,275,14);ctx.fillStyle='#f5f7f9';ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#d6e0e5';ctx.stroke();text(ctx,'结构化信息',552,116,18,'#677a87','center',600);ctx.restore();
  const fields=[['方向','买入'],['产品','示例债券A'],['结算日','9月15日'],['金额','需确认']];
  fields.forEach((field,i)=>{const y=145+i*47;round(ctx,452,y,200,38,7);ctx.fillStyle=i===3?'#fff1e6':'#edf1f4';ctx.fill();ctx.strokeStyle=i===3?'#dfb897':'#dce4e9';ctx.setLineDash(i===3?[4,4]:[]);ctx.stroke();ctx.setLineDash([]);if(i===3){text(ctx,field[0],464,y+19,15,'#a37756');text(ctx,field[1],639,y+19,16,'#ad652f','right',600);return;}const p=ease(clamp((cycle-.16-i*.07)/.28));const x=mix(159,452,p);const yy=mix(167+i*28,y,p);ctx.save();ctx.globalAlpha*=clamp((cycle-.08-i*.04)*5);ctx.shadowColor='rgba(42,64,80,.1)';ctx.shadowBlur=13;ctx.shadowOffsetY=5;round(ctx,x,yy,200,38,7);ctx.fillStyle='#fff';ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#d5e1e6';ctx.stroke();text(ctx,field[0],x+12,yy+19,15,'#83939e');text(ctx,field[1],x+187,yy+19,16,'#324c5d','right',600);ctx.restore()});
  text(ctx,'原文依据',209,376,17,'#7f8b93','center');text(ctx,'保留缺失项，不猜测',552,391,17,'#a2714f','center');
}
function pulse(ctx,t,photo){
  shadow(ctx,365,353,246,30,.08);
  ctx.save();ctx.translate(202,211);ctx.rotate(-.045);ctx.shadowColor='rgba(37,55,66,.13)';ctx.shadowBlur=24;ctx.shadowOffsetY=9;round(ctx,-124,-142,244,288,13);ctx.fillStyle='#fff';ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#d3dde2';ctx.stroke();ctx.save();round(ctx,-110,-128,216,218,8);ctx.clip();if(photo&&photo.complete&&photo.naturalWidth){ctx.drawImage(photo,280,0,465,495,-110,-128,216,218)}else{ctx.fillStyle='#dce5e8';ctx.fillRect(-110,-128,216,218);text(ctx,'视频区域',-2,-15,20,'#687b85','center')}const green=.10+.055*Math.sin(t*TAU*1.13);ctx.fillStyle=`rgba(55,183,118,${green})`;ctx.fillRect(-46,-109,56,25);ctx.strokeStyle='#a5e3bd';ctx.lineWidth=1.6;ctx.strokeRect(-46,-109,56,25);const scan=-109+((t*.21)%1)*25;line(ctx,[{x:-46,y:scan},{x:10,y:scan}],'rgba(180,241,205,.76)',1.5);ctx.restore();text(ctx,'皮肤区域 / 示意',-3,118,17,'#72848e','center');ctx.restore();
  round(ctx,372,123,303,194,13);ctx.fillStyle='#f7f9fa';ctx.fill();ctx.strokeStyle='#d7e1e6';ctx.lineWidth=1;ctx.stroke();text(ctx,'合成 PPG 信号',397,152,18,'#566f7c','left',600);
  for(let i=0;i<5;i++)line(ctx,[{x:395,y:185+i*25},{x:655,y:185+i*25}],'#e4e9ec',1);
  const points=[];for(let i=0;i<=260;i++){const phase=((i/71+t*.72)%1);const wave=Math.exp(-Math.pow((phase-.24)/.095,2))+.32*Math.exp(-Math.pow((phase-.53)/.14,2));points.push({x:395+i,y:274-wave*71})}
  const fill=ctx.createLinearGradient(0,190,0,280);fill.addColorStop(0,'rgba(218,138,74,.2)');fill.addColorStop(1,'rgba(218,138,74,0)');ctx.beginPath();ctx.moveTo(395,281);points.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(655,281);ctx.closePath();ctx.fillStyle=fill;ctx.fill();line(ctx,points,'#c5763d',2.7);
  for(let i=0;i<3;i++){const x=330+i*10;line(ctx,[{x,y:200},{x:x+5,y:207},{x,y:214}],`rgba(100,136,151,${.2+.35*(.5+.5*Math.sin(t*2-i))})`,1.5)}
  text(ctx,'视频颜色变化 → 时间序列',523,354,17,'#7c8d98','center');
}
export function drawScene(ctx,width,height,time,index,photo){
  ctx.save();const scale=Math.min(width/720,height/430);ctx.translate((width-720*scale)/2,(height-430*scale)/2);ctx.scale(scale,scale);
  if(index===0)thinFilm(ctx,time);else if(index===1)materials(ctx,time);else if(index===2)message(ctx,time);else pulse(ctx,time,photo);
  ctx.restore();
}
