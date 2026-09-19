/* Procedural torus-knot renderer. The tube is generated entirely on the GPU from the vertex index,
   so knot type, writhe, pulse and pointer deformation change per frame with no buffer uploads.
   Both backends share the same math. No adapter/device is fingerprinted or logged. */
const UNIFORM_FLOATS=20;
const GLSL_VERTEX=`#version 300 es
precision highp float;
uniform vec4 u[5];
out vec3 vNormal;
out vec2 vUV;
out float vHeat;
#define ANG u[0]
#define PAR u[1]
#define KNOT u[2]
#define SHAPE u[3]
#define PTR u[4]
vec3 rot(vec3 p){
 float c=cos(ANG.x),s=sin(ANG.x);p=vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);
 c=cos(ANG.y);s=sin(ANG.y);p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);
 c=cos(ANG.z);s=sin(ANG.z);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);
}
vec3 knot(float p,float q,float t){float r=2.+cos(q*t);return vec3(r*cos(p*t),r*sin(p*t),sin(q*t));}
vec3 curve(float t){
 float T=PAR.z,w=SHAPE.z;
 vec3 c=mix(knot(KNOT.x,KNOT.y,t),knot(KNOT.z,KNOT.w,t),SHAPE.x);
 return c+w*vec3(.34*sin(3.*t+T*1.3)+.12*sin(7.*t-T*2.1),.34*cos(2.*t-T*1.1)+.12*cos(5.*t+T*1.7),.42*sin(4.*t+T*.9)*cos(t-T*.6));
}
void main(){
 int segs=int(PTR.z),sides=int(PTR.w),quad=gl_VertexID/6,k=gl_VertexID-quad*6;
 int di=(k==1||k==2||k==4)?1:0,dj=(k==2||k==4||k==5)?1:0;
 float uu=float(quad/sides+di)/float(segs),vv=float(quad-(quad/sides)*sides+dj)/float(sides);
 float t=uu*6.2831853,phi=vv*6.2831853;
 vec3 c=curve(t),T=normalize(curve(t+.002)-curve(t-.002));
 vec3 rad=vec3(normalize(c.xy),0.);vec3 N=normalize(rad-dot(rad,T)*T),B=cross(T,N);
 vec3 n=rot(N*cos(phi)+B*sin(phi));
 float r=SHAPE.y*(1.+SHAPE.w*.42*sin(9.*t-PAR.z*3.2));
 vec3 pc=rot(c),p=pc+n*r;
 vec2 aim=vec2(PTR.x*ANG.w,PTR.y)/PAR.x;
 vec2 d=(pc.xy-aim)*PAR.x;
 float f=exp(-dot(d,d)*14.)*PAR.w;
 p+=n*r*f*1.1;p.xy+=(aim-p.xy)*clamp(f*.32,-.4,.6);p.z-=f*.9;
 gl_Position=vec4(p.x*PAR.x/ANG.w,p.y*PAR.x,p.z*.1,1.);
 vNormal=n;vUV=vec2(uu*(KNOT.x+KNOT.y+KNOT.z+KNOT.w)*.2-PAR.z*.02,vv);vHeat=abs(f);
}`;
const GLSL_FRAGMENT=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUV;
in float vHeat;
uniform vec4 u[5];
out vec4 color;
void main(){
 vec3 n=normalize(vNormal);vec3 light=normalize(vec3(-.55,.8,-1.2));
 float diff=max(dot(n,light),0.);float spec=pow(max(dot(reflect(-light,n),vec3(0.,0.,-1.)),0.),30.);
 float blend=.19+.15*sin(vUV.x*6.283185);
 vec3 copper=mix(vec3(.71,.55,.35),vec3(.41,.52,.43),blend);
 vec3 shade=copper*(.57+.55*diff)+vec3(.35,.29,.18)*spec;
 vec2 grid=vUV*vec2(152.,24.);vec2 edge=abs(fract(grid-.5)-.5)/max(fwidth(grid),vec2(.0001));
 float wire=1.-smoothstep(.38,1.1,min(edge.x,edge.y));
 shade=mix(shade,shade*.48,wire*.78);
 float rim=pow(1.-abs(n.z),3.);
 shade+=vec3(.19,.15,.09)*rim+vec3(.55,.32,.14)*min(vHeat,1.)*(.35+.65*rim);
 shade*=1.+u[1].y*.14;
 color=vec4(shade,1.);
}`;
const WGSL=`
struct U { ang: vec4<f32>, par: vec4<f32>, knot: vec4<f32>, shape: vec4<f32>, ptr: vec4<f32> };
@group(0) @binding(0) var<uniform> u: U;
struct Out { @builtin(position) position: vec4<f32>, @location(0) normal: vec3<f32>, @location(1) uv: vec2<f32>, @location(2) heat: f32 };
fn rot(point: vec3<f32>) -> vec3<f32> {
 var p=point;var c=cos(u.ang.x);var s=sin(u.ang.x);
 p=vec3<f32>(p.x,p.y*c-p.z*s,p.y*s+p.z*c);
 c=cos(u.ang.y);s=sin(u.ang.y);p=vec3<f32>(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);
 c=cos(u.ang.z);s=sin(u.ang.z);return vec3<f32>(p.x*c-p.y*s,p.x*s+p.y*c,p.z);
}
fn knot(p: f32, q: f32, t: f32) -> vec3<f32> { let r=2.+cos(q*t); return vec3<f32>(r*cos(p*t),r*sin(p*t),sin(q*t)); }
fn curve(t: f32) -> vec3<f32> {
 let T=u.par.z;let w=u.shape.z;
 let c=mix(knot(u.knot.x,u.knot.y,t),knot(u.knot.z,u.knot.w,t),u.shape.x);
 return c+w*vec3<f32>(.34*sin(3.*t+T*1.3)+.12*sin(7.*t-T*2.1),.34*cos(2.*t-T*1.1)+.12*cos(5.*t+T*1.7),.42*sin(4.*t+T*.9)*cos(t-T*.6));
}
@vertex fn vertexMain(@builtin(vertex_index) vid: u32) -> Out {
 let segs=u32(u.ptr.z);let sides=u32(u.ptr.w);let quad=vid/6u;let k=vid%6u;
 let di=select(0u,1u,k==1u||k==2u||k==4u);let dj=select(0u,1u,k==2u||k==4u||k==5u);
 let uu=f32(quad/sides+di)/f32(segs);let vv=f32(quad%sides+dj)/f32(sides);
 let t=uu*6.2831853;let phi=vv*6.2831853;
 let c=curve(t);let T=normalize(curve(t+.002)-curve(t-.002));
 let rad=vec3<f32>(normalize(c.xy),0.);let N=normalize(rad-dot(rad,T)*T);let B=cross(T,N);
 let n=rot(N*cos(phi)+B*sin(phi));
 let r=u.shape.y*(1.+u.shape.w*.42*sin(9.*t-u.par.z*3.2));
 let pc=rot(c);var p=pc+n*r;
 let aim=vec2<f32>(u.ptr.x*u.ang.w,u.ptr.y)/u.par.x;
 let d=(pc.xy-aim)*u.par.x;
 let f=exp(-dot(d,d)*14.)*u.par.w;
 p+=n*r*f*1.1;p=vec3<f32>(p.xy+(aim-p.xy)*clamp(f*.32,-.4,.6),p.z-f*.9);
 var o:Out;
 o.position=vec4<f32>(p.x*u.par.x/u.ang.w,p.y*u.par.x,p.z*.1+.5,1.);
 o.normal=n;o.uv=vec2<f32>(uu*(u.knot.x+u.knot.y+u.knot.z+u.knot.w)*.2-u.par.z*.02,vv);o.heat=abs(f);return o;
}
@fragment fn fragmentMain(v:Out)->@location(0) vec4<f32>{
 let n=normalize(v.normal);let light=normalize(vec3<f32>(-.55,.8,-1.2));
 let diff=max(dot(n,light),0.);let spec=pow(max(dot(reflect(-light,n),vec3<f32>(0.,0.,-1.)),0.),30.);
 let blend=.19+.15*sin(v.uv.x*6.283185);
 let copper=mix(vec3<f32>(.71,.55,.35),vec3<f32>(.41,.52,.43),blend);
 var shade=copper*(.57+.55*diff)+vec3<f32>(.35,.29,.18)*spec;
 let grid=v.uv*vec2<f32>(152.,24.);
 let edge=abs(fract(grid-.5)-.5)/max(fwidth(grid),vec2<f32>(.0001));
 let wire=1.-smoothstep(.38,1.1,min(edge.x,edge.y));
 shade=mix(shade,shade*.48,wire*.78);
 let rim=pow(1.-abs(n.z),3.);
 shade+=vec3<f32>(.19,.15,.09)*rim+vec3<f32>(.55,.32,.14)*min(v.heat,1.)*(.35+.65*rim);
 shade*=1.+u.par.y*.14;
 return vec4<f32>(shade,1.);
}`;
function makeWebGL(canvas,count){
  const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:false});
  if(!gl)throw new Error('WebGL2 is unavailable');
  const shaders=[];
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(message);}shaders.push(s);return s;}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,GLSL_VERTEX));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,GLSL_FRAGMENT));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  const vao=gl.createVertexArray(),location=gl.getUniformLocation(program,'u');
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.clearColor(0,0,0,0);
  return {name:'WebGL2',resize(w,h){gl.viewport(0,0,w,h);},draw(uniforms){
    if(gl.isContextLost())return;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.bindVertexArray(vao);
    gl.uniform4fv(location,uniforms);gl.drawArrays(gl.TRIANGLES,0,count);
  },destroy(){gl.deleteVertexArray(vao);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));}};
}
async function makeWebGPU(canvas,count,onLost){
  if(!navigator.gpu)throw new Error('WebGPU is unavailable');
  const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
  if(!adapter)throw new Error('No WebGPU adapter');
  const device=await adapter.requestDevice();
  try{
    const context=canvas.getContext('webgpu');if(!context)throw new Error('No WebGPU canvas context');
    const format=navigator.gpu.getPreferredCanvasFormat();context.configure({device,format,alphaMode:'premultiplied'});
    const uniformBuffer=device.createBuffer({size:UNIFORM_FLOATS*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    const module=device.createShaderModule({code:WGSL});
    const pipeline=await device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vertexMain'},fragment:{module,entryPoint:'fragmentMain',targets:[{format}]},primitive:{topology:'triangle-list'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'},multisample:{count:4}});
    const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniformBuffer}}]});let depth=null,msaa=null;
    device.lost.then(info=>{if(info.reason!=='destroyed')onLost();});
    return {name:'WebGPU',resize(w,h){depth?.destroy();msaa?.destroy();
      depth=device.createTexture({size:[w,h],format:'depth24plus',sampleCount:4,usage:GPUTextureUsage.RENDER_ATTACHMENT});
      msaa=device.createTexture({size:[w,h],format,sampleCount:4,usage:GPUTextureUsage.RENDER_ATTACHMENT});},draw(uniforms){
      if(!depth)return;device.queue.writeBuffer(uniformBuffer,0,uniforms);
      const encoder=device.createCommandEncoder();const pass=encoder.beginRenderPass({colorAttachments:[{view:msaa.createView(),resolveTarget:context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:'clear',storeOp:'discard'}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'discard'}});
      pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.draw(count);pass.end();device.queue.submit([encoder.finish()]);
    },destroy(){depth?.destroy();msaa?.destroy();uniformBuffer.destroy();context.unconfigure();device.destroy();}};
  }catch(error){device.destroy();throw error;}
}
const DEFAULTS={writhe:.35,pulse:.3,thickness:.235,speed:1,pull:.7};
const AUTO_SPIN=.00012;
export async function initializeSculpture(){
  const stage=document.getElementById('sculpture-stage');if(!stage)return null;
  let canvas=document.getElementById('sculpture-canvas'),renderer=null,raf=0,last=0,time=0,visible=true,disposed=false;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduce.matches;
  try{paused=reduce.matches||localStorage.getItem('invariant:motion')==='paused';}catch{}
  const view={yaw:.24,pitch:.62,vyaw:0,vpitch:0},roll=-.32;
  const knot={from:[2,3],to:[2,3],morph:1};
  const settings={...DEFAULTS};
  const pointer={x:0,y:0,tx:0,ty:0,s:0,vs:0,hover:false,down:false};
  const uniforms=new Float32Array(UNIFORM_FLOATS);
  const label=document.getElementById('render-backend'),motion=document.getElementById('motion-toggle'),meta=document.getElementById('knot-type'),panel=document.getElementById('knot-panel');
  const forced=new URLSearchParams(location.search).get('renderer');
  const segs=matchMedia('(max-width: 640px)').matches?360:560,sides=28,count=segs*sides*6;
  function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
  function lose(){stop();stage.classList.remove('rendering');panel?.setAttribute('hidden','');label.textContent='SVG';renderer?.destroy();renderer=null;updateButtons();}
  function updateButtons(){
    motion.disabled=!renderer;document.getElementById('rotate-sculpture').disabled=!renderer;motion.textContent=paused?'▷':'Ⅱ';motion.setAttribute('aria-pressed',String(paused));
    const zh=document.documentElement.lang==='zh-CN';motion.setAttribute('aria-label',paused?(zh?'播放动画':'Play animation'):(zh?'暂停动画':'Pause animation'));
  }
  const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
  function draw(){
    if(!renderer||disposed)return;
    uniforms.set([view.pitch,view.yaw,roll,canvas.width/canvas.height,.27*Math.min(1,canvas.width/canvas.height*1.1),document.documentElement.dataset.theme==='dark'?1:0,time,pointer.s,
      ...knot.from,...knot.to,ease(knot.morph),settings.thickness,settings.writhe,settings.pulse,pointer.x,pointer.y,segs,sides]);
    try{renderer.draw(uniforms);}catch{lose();}
  }
  function settled(){return !pointer.down&&Math.abs(pointer.s)<.002&&Math.abs(pointer.vs)<.002&&Math.abs(pointer.tx-pointer.x)<.001&&Math.abs(pointer.ty-pointer.y)<.001&&knot.morph>=1&&Math.abs(view.vyaw)<1e-5&&Math.abs(view.vpitch)<1e-5;}
  function step(dt){
    if(!paused)time+=dt*.001*settings.speed;
    if(knot.morph<1)knot.morph=Math.min(1,knot.morph+dt/900);
    const follow=1-Math.exp(-dt*(pointer.down?.02:.009));pointer.x+=(pointer.tx-pointer.x)*follow;pointer.y+=(pointer.ty-pointer.y)*follow;
    const goal=pointer.down?settings.pull*1.35:pointer.hover?settings.pull*.45:0,h=Math.min(dt,32)*.001;
    for(let i=0;i<4;i++){pointer.vs+=((goal-pointer.s)*260-pointer.vs*7)*h/4;pointer.s+=pointer.vs*h/4;}
    if(!drag){
      const spin=paused?0:AUTO_SPIN*settings.speed,decay=Math.exp(-dt*.0035);
      view.vyaw=spin+(view.vyaw-spin)*decay;view.vpitch*=decay;
      view.yaw+=view.vyaw*dt;view.pitch=Math.max(-1.5,Math.min(1.5,view.pitch+view.vpitch*dt));
      if(paused&&Math.abs(view.vyaw)<1e-5)view.vyaw=0;
    }
  }
  function tick(now){
    raf=0;if(disposed||!visible||document.hidden||!renderer)return;
    const dt=last?Math.min(now-last,50):16;last=now;step(dt);draw();
    if(!paused||!settled())raf=requestAnimationFrame(tick);else last=0;
  }
  function kick(){if(!raf&&renderer&&visible&&!document.hidden&&!disposed)raf=requestAnimationFrame(tick);}
  function sync(){stop();if(visible&&!document.hidden)draw();kick();}
  function resize(){
    const box=stage.getBoundingClientRect();if(!box.width||!box.height)return;
    const dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.min(2000,Math.round(box.width*dpr))),h=Math.max(1,Math.min(2000,Math.round(box.height*dpr)));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;renderer?.resize(w,h);}draw();
  }
  function newCanvas(){const next=canvas.cloneNode(false);canvas.replaceWith(next);canvas=next;}
  if(forced!=='svg'){
    if(forced!=='webgl2'){try{renderer=await makeWebGPU(canvas,count,lose);}catch{newCanvas();}}
    if(!renderer){try{renderer=makeWebGL(canvas,count);}catch{newCanvas();}}
  }
  if(renderer){label.textContent=renderer.name;stage.classList.add('rendering');panel?.removeAttribute('hidden');canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lose();});}
  else{label.textContent='SVG';paused=true;}
  resize();const ro=new ResizeObserver(resize);ro.observe(stage);
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05});io.observe(stage);
  document.addEventListener('visibilitychange',sync);
  const changeTheme=()=>draw();document.addEventListener('invariant:theme',changeTheme);
  document.addEventListener('invariant:language',updateButtons);
  const reducedChanged=()=>{if(reduce.matches)paused=true;updateButtons();sync();};reduce.addEventListener('change',reducedChanged);
  function toggle(){if(!renderer)return;paused=!paused;try{localStorage.setItem('invariant:motion',paused?'paused':'playing');}catch{}updateButtons();sync();}
  motion.addEventListener('click',toggle);
  document.getElementById('rotate-sculpture').addEventListener('click',()=>{view.vyaw+=.006;kick();});

  function toClip(event){const box=stage.getBoundingClientRect();return[(event.clientX-box.left)/box.width*2-1,1-(event.clientY-box.top)/box.height*2];}
  let drag=null;
  stage.addEventListener('pointerdown',event=>{
    if(!renderer||(event.pointerType==='mouse'&&event.button!==0))return;
    const[x,y]=toClip(event);pointer.tx=x;pointer.ty=y;pointer.down=true;pointer.hover=true;
    drag={x:event.clientX,y:event.clientY,t:event.timeStamp};view.vyaw=view.vpitch=0;
    stage.setPointerCapture(event.pointerId);stage.classList.add('grabbing');kick();
  });
  stage.addEventListener('pointermove',event=>{
    if(!renderer)return;const[x,y]=toClip(event);pointer.tx=x;pointer.ty=y;
    if(event.pointerType==='mouse')pointer.hover=true;
    if(drag){
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y,dt=Math.max(event.timeStamp-drag.t,1);
      view.yaw+=dx*.008;view.pitch=Math.max(-1.5,Math.min(1.5,view.pitch+dy*.006));
      view.vyaw=view.vyaw*.6+dx*.008/dt*.4;view.vpitch=view.vpitch*.6+dy*.006/dt*.4;
      drag={x:event.clientX,y:event.clientY,t:event.timeStamp};
    }
    kick();
  });
  const release=event=>{if(drag&&event.timeStamp-drag.t>80)view.vyaw=view.vpitch=0;drag=null;pointer.down=false;if(event.pointerType!=='mouse')pointer.hover=false;stage.classList.remove('grabbing');kick();};
  stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
  stage.addEventListener('pointerleave',()=>{if(!drag){pointer.hover=false;kick();}});
  stage.addEventListener('dblclick',()=>{view.yaw=.24;view.pitch=.62;view.vyaw=view.vpitch=0;kick();});

  function setKnot(p,q){
    const current=knot.morph>=1?knot.to:knot.morph>.5?knot.to:knot.from;
    knot.from=[...current];knot.to=[p,q];knot.morph=0;
    if(meta)meta.textContent=`T(${p}, ${q})`;
    stage.setAttribute('aria-label',`A writhing (${p},${q}) torus knot, a continuous curve in three-dimensional space`);
    pointer.vs+=4;kick();
  }
  const presets=[...(panel?.querySelectorAll('[data-knot]')||[])];
  for(const button of presets)button.addEventListener('click',()=>{
    const[p,q]=button.dataset.knot.split(',').map(Number);if(p===knot.to[0]&&q===knot.to[1])return;
    presets.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));setKnot(p,q);
  });
  const sliders=[...(panel?.querySelectorAll('input[type=range]')||[])];
  function showValue(input){const out=panel.querySelector(`output[for="${input.id}"]`);if(out)out.textContent=Number(input.value).toFixed(2);}
  for(const input of sliders){
    input.value=settings[input.name];showValue(input);
    input.addEventListener('input',()=>{settings[input.name]=Number(input.value);showValue(input);if(input.name==='pull'){pointer.vs+=2;}kick();});
  }
  panel?.querySelector('[data-reset]')?.addEventListener('click',()=>{
    Object.assign(settings,DEFAULTS);sliders.forEach(input=>{input.value=settings[input.name];showValue(input);});
    presets.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.knot==='2,3')));if(knot.to[0]!==2||knot.to[1]!==3)setKnot(2,3);
    view.yaw=.24;view.pitch=.62;kick();
  });

  updateButtons();sync();return {toggleMotion:toggle,get backend(){return renderer?.name||'SVG';},destroy(){disposed=true;stop();ro.disconnect();io.disconnect();renderer?.destroy();document.removeEventListener('visibilitychange',sync);document.removeEventListener('invariant:theme',changeTheme);document.removeEventListener('invariant:language',updateButtons);reduce.removeEventListener('change',reducedChanged);}};
}
