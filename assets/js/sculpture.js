/* Procedural torus-knot renderer. The tube is generated entirely on the GPU from the vertex index,
   so knot type, writhe, pulse and pointer deformation change per frame with no buffer uploads.
   T(p,q) with gcd(p,q)=d>1 is drawn as its d-component torus link. Space itself is carried by a
   time-dependent diffeomorphism (a composition of shear maps, each exactly invertible); the knot and
   a faint ambient lattice are pushed forward by the same map, so the knot type never changes.
   Both backends share the same math. No adapter/device is fingerprinted or logged. */
const UNIFORM_FLOATS=24,LATTICE_VERTICES=119*128;
const GLSL_HEAD=`#version 300 es
precision highp float;
uniform vec4 u[6];
`;
const GLSL_LIB=`#define ANG u[0]
#define PAR u[1]
#define KNOT u[2]
#define SHAPE u[3]
#define PTR u[4]
#define TOPO u[5]
vec3 rot(vec3 p){
 float c=cos(ANG.x),s=sin(ANG.x);p=vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);
 c=cos(ANG.y);s=sin(ANG.y);p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);
 c=cos(ANG.z);s=sin(ANG.z);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);
}
void flow(inout vec3 p,inout vec3 n){
 float a=TOPO.z,T=PAR.z,s;
 s=.9*p.y+1.3*p.z+T*.7;p.x+=a*sin(s);n-=a*cos(s)*n.x*vec3(0.,.9,1.3);
 s=.7*p.x+.8*p.z-T*.9+1.;p.y+=a*sin(s);n-=a*cos(s)*n.y*vec3(.7,0.,.8);
 s=.6*p.x+.9*p.y+T*.5+2.;p.z+=.7*a*sin(s);n-=.7*a*cos(s)*n.z*vec3(.6,.9,0.);
}
vec4 project(vec3 p){return vec4(p.x*PAR.x/ANG.w,p.y*PAR.x,p.z*.1,1.);}
`;
const GLSL_VERTEX=GLSL_HEAD+GLSL_LIB+`out vec3 vNormal;
out vec2 vUV;
out float vHeat;
out float vComp;
vec3 arm(float p,float q,float d,float uu,float uc){
 float k=floor(uc*d),t=(uu*d-k)*6.2831853,r=2.+cos(q*t),a=p*t+6.2831853*k/(d*q),T=PAR.z;
 return vec3(r*cos(a),r*sin(a),sin(q*t))+SHAPE.z*vec3(.34*sin(3.*t+T*1.3)+.12*sin(7.*t-T*2.1),.34*cos(2.*t-T*1.1)+.12*cos(5.*t+T*1.7),.42*sin(4.*t+T*.9)*cos(t-T*.6));
}
vec3 curve(float uu,float uc){return mix(arm(KNOT.x,KNOT.y,TOPO.x,uu,uc),arm(KNOT.z,KNOT.w,TOPO.y,uu,uc),SHAPE.x);}
void main(){
 int segs=int(PTR.z),sides=int(PTR.w),quad=gl_VertexID/6,k=gl_VertexID-quad*6,seg=quad/sides;
 int di=(k==1||k==2||k==4)?1:0,dj=(k==2||k==4||k==5)?1:0;
 float uu=float(seg+di)/float(segs),uc=(float(seg)+.5)/float(segs),vv=float(quad-seg*sides+dj)/float(sides);
 float lu=uu*TOPO.y-floor(uc*TOPO.y),phi=vv*6.2831853;
 vec3 c=curve(uu,uc),T=normalize(curve(uu+.0003,uc)-curve(uu-.0003,uc));
 vec3 rad=vec3(normalize(c.xy),0.);vec3 N=normalize(rad-dot(rad,T)*T),B=cross(T,N);
 vec3 n=N*cos(phi)+B*sin(phi);
 float r=SHAPE.y*(1.+SHAPE.w*.42*sin(9.*lu*6.2831853-PAR.z*3.2));
 vec3 s=c+n*r,ns=n,cw=c,nc=n;flow(s,ns);flow(cw,nc);
 n=rot(normalize(ns));vec3 pc=rot(cw),p=rot(s);
 vec2 aim=vec2(PTR.x*ANG.w,PTR.y)/PAR.x;
 vec2 d=(pc.xy-aim)*PAR.x;
 float f=exp(-dot(d,d)*14.)*PAR.w;
 p+=n*r*f*1.1;p.xy+=(aim-p.xy)*clamp(f*.32,-.4,.6);p.z-=f*.9;
 gl_Position=project(p);
 vNormal=n;vUV=vec2(lu*max(2.,floor((KNOT.z+KNOT.w)*.4+.5))-PAR.z*.02,vv);vHeat=abs(f);vComp=TOPO.y>1.?floor(uc*TOPO.y)/(TOPO.y-1.):0.;
}`;
const GLSL_FRAGMENT=GLSL_HEAD+`in vec3 vNormal;
in vec2 vUV;
in float vHeat;
in float vComp;
out vec4 color;
void main(){
 vec3 n=normalize(vNormal);vec3 light=normalize(vec3(-.55,.8,-1.2));
 float diff=max(dot(n,light),0.);float spec=pow(max(dot(reflect(-light,n),vec3(0.,0.,-1.)),0.),30.);
 float blend=.19+.15*sin(vUV.x*6.283185);
 vec3 copper=mix(mix(vec3(.71,.55,.35),vec3(.41,.52,.43),blend),vec3(.38,.5,.56),vComp*.5);
 vec3 shade=copper*(.57+.55*diff)+vec3(.35,.29,.18)*spec;
 vec2 grid=vUV*vec2(152.,24.);vec2 edge=abs(fract(grid-.5)-.5)/max(fwidth(grid),vec2(.0001));
 float wire=1.-smoothstep(.38,1.1,min(edge.x,edge.y));
 shade=mix(shade,shade*.48,wire*.78);
 float rim=pow(1.-abs(n.z),3.);
 shade+=vec3(.19,.15,.09)*rim+vec3(.55,.32,.14)*min(vHeat,1.)*(.35+.65*rim);
 shade*=1.+u[1].y*.14;
 color=vec4(shade,1.);
}`;
const GLSL_LATTICE_VERTEX=GLSL_HEAD+GLSL_LIB+`out float vA;
void main(){
 int M=64,ln=gl_VertexID/(2*M),s=gl_VertexID-ln*2*M,seg=s/2+s-(s/2)*2;
 float f=float(seg)/float(M)*2.-1.;vec3 p;
 if(ln<35){int j=ln/5;p=vec3(3.*f,float(j)-3.,float(ln-j*5)-2.);}
 else if(ln<70){int l=ln-35,j=l/5;p=vec3(float(j)-3.,3.*f,float(l-j*5)-2.);}
 else{int l=ln-70,j=l/7;p=vec3(float(j)-3.,float(l-j*7)-3.,2.*f);}
 float fade=1.-smoothstep(2.,3.6,length(p));vec3 n=vec3(0.);flow(p,n);p=rot(p);
 gl_Position=project(p);vA=TOPO.w*fade*(.55+.45*clamp(.5-p.z*.2,0.,1.));
}`;
const GLSL_LATTICE_FRAGMENT=GLSL_HEAD+`in float vA;
out vec4 color;
void main(){vec3 ink=mix(vec3(.30,.25,.18),vec3(.86,.76,.56),u[1].y);color=vec4(ink*vA,vA);}`;
const WGSL=`
struct U { ang: vec4<f32>, par: vec4<f32>, knot: vec4<f32>, shape: vec4<f32>, ptr: vec4<f32>, topo: vec4<f32> };
@group(0) @binding(0) var<uniform> u: U;
struct Out { @builtin(position) position: vec4<f32>, @location(0) normal: vec3<f32>, @location(1) uv: vec2<f32>, @location(2) heat: f32, @location(3) comp: f32 };
struct LOut { @builtin(position) position: vec4<f32>, @location(0) alpha: f32 };
struct PN { p: vec3<f32>, n: vec3<f32> };
fn rot(point: vec3<f32>) -> vec3<f32> {
 var p=point;var c=cos(u.ang.x);var s=sin(u.ang.x);
 p=vec3<f32>(p.x,p.y*c-p.z*s,p.y*s+p.z*c);
 c=cos(u.ang.y);s=sin(u.ang.y);p=vec3<f32>(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);
 c=cos(u.ang.z);s=sin(u.ang.z);return vec3<f32>(p.x*c-p.y*s,p.x*s+p.y*c,p.z);
}
fn flow(point: vec3<f32>, normal: vec3<f32>) -> PN {
 var p=point;var n=normal;let a=u.topo.z;let T=u.par.z;
 var s=.9*p.y+1.3*p.z+T*.7;p.x+=a*sin(s);n-=a*cos(s)*n.x*vec3<f32>(0.,.9,1.3);
 s=.7*p.x+.8*p.z-T*.9+1.;p.y+=a*sin(s);n-=a*cos(s)*n.y*vec3<f32>(.7,0.,.8);
 s=.6*p.x+.9*p.y+T*.5+2.;p.z+=.7*a*sin(s);n-=.7*a*cos(s)*n.z*vec3<f32>(.6,.9,0.);
 return PN(p,n);
}
fn project(p: vec3<f32>) -> vec4<f32> { return vec4<f32>(p.x*u.par.x/u.ang.w,p.y*u.par.x,p.z*.1+.5,1.); }
fn arm(p: f32, q: f32, d: f32, uu: f32, uc: f32) -> vec3<f32> {
 let k=floor(uc*d);let t=(uu*d-k)*6.2831853;let r=2.+cos(q*t);let a=p*t+6.2831853*k/(d*q);let T=u.par.z;
 return vec3<f32>(r*cos(a),r*sin(a),sin(q*t))+u.shape.z*vec3<f32>(.34*sin(3.*t+T*1.3)+.12*sin(7.*t-T*2.1),.34*cos(2.*t-T*1.1)+.12*cos(5.*t+T*1.7),.42*sin(4.*t+T*.9)*cos(t-T*.6));
}
fn curve(uu: f32, uc: f32) -> vec3<f32> { return mix(arm(u.knot.x,u.knot.y,u.topo.x,uu,uc),arm(u.knot.z,u.knot.w,u.topo.y,uu,uc),u.shape.x); }
@vertex fn vertexMain(@builtin(vertex_index) vid: u32) -> Out {
 let segs=u32(u.ptr.z);let sides=u32(u.ptr.w);let quad=vid/6u;let k=vid%6u;let seg=quad/sides;
 let di=select(0u,1u,k==1u||k==2u||k==4u);let dj=select(0u,1u,k==2u||k==4u||k==5u);
 let uu=f32(seg+di)/f32(segs);let uc=(f32(seg)+.5)/f32(segs);let vv=f32(quad%sides+dj)/f32(sides);
 let lu=uu*u.topo.y-floor(uc*u.topo.y);let phi=vv*6.2831853;
 let c=curve(uu,uc);let T=normalize(curve(uu+.0003,uc)-curve(uu-.0003,uc));
 let rad=vec3<f32>(normalize(c.xy),0.);let N=normalize(rad-dot(rad,T)*T);let B=cross(T,N);
 let n0=N*cos(phi)+B*sin(phi);
 let r=u.shape.y*(1.+u.shape.w*.42*sin(9.*lu*6.2831853-u.par.z*3.2));
 let surface=flow(c+n0*r,n0);let center=flow(c,n0);
 let n=rot(normalize(surface.n));let pc=rot(center.p);var p=rot(surface.p);
 let aim=vec2<f32>(u.ptr.x*u.ang.w,u.ptr.y)/u.par.x;
 let d=(pc.xy-aim)*u.par.x;
 let f=exp(-dot(d,d)*14.)*u.par.w;
 p+=n*r*f*1.1;p=vec3<f32>(p.xy+(aim-p.xy)*clamp(f*.32,-.4,.6),p.z-f*.9);
 var o:Out;
 o.position=project(p);
 o.normal=n;o.uv=vec2<f32>(lu*max(2.,floor((u.knot.z+u.knot.w)*.4+.5))-u.par.z*.02,vv);o.heat=abs(f);o.comp=select(0.,floor(uc*u.topo.y)/(u.topo.y-1.),u.topo.y>1.);return o;
}
@fragment fn fragmentMain(v:Out)->@location(0) vec4<f32>{
 let n=normalize(v.normal);let light=normalize(vec3<f32>(-.55,.8,-1.2));
 let diff=max(dot(n,light),0.);let spec=pow(max(dot(reflect(-light,n),vec3<f32>(0.,0.,-1.)),0.),30.);
 let blend=.19+.15*sin(v.uv.x*6.283185);
 let copper=mix(mix(vec3<f32>(.71,.55,.35),vec3<f32>(.41,.52,.43),blend),vec3<f32>(.38,.5,.56),v.comp*.5);
 var shade=copper*(.57+.55*diff)+vec3<f32>(.35,.29,.18)*spec;
 let grid=v.uv*vec2<f32>(152.,24.);
 let edge=abs(fract(grid-.5)-.5)/max(fwidth(grid),vec2<f32>(.0001));
 let wire=1.-smoothstep(.38,1.1,min(edge.x,edge.y));
 shade=mix(shade,shade*.48,wire*.78);
 let rim=pow(1.-abs(n.z),3.);
 shade+=vec3<f32>(.19,.15,.09)*rim+vec3<f32>(.55,.32,.14)*min(v.heat,1.)*(.35+.65*rim);
 shade*=1.+u.par.y*.14;
 return vec4<f32>(shade,1.);
}
@vertex fn latticeVertex(@builtin(vertex_index) vid: u32) -> LOut {
 let M=64u;let ln=vid/(2u*M);let s=vid%(2u*M);let seg=s/2u+s%2u;
 let f=f32(seg)/f32(M)*2.-1.;var p:vec3<f32>;
 if(ln<35u){p=vec3<f32>(3.*f,f32(ln/5u)-3.,f32(ln%5u)-2.);}
 else if(ln<70u){let l=ln-35u;p=vec3<f32>(f32(l/5u)-3.,3.*f,f32(l%5u)-2.);}
 else{let l=ln-70u;p=vec3<f32>(f32(l/7u)-3.,f32(l%7u)-3.,2.*f);}
 let fade=1.-smoothstep(2.,3.6,length(p));
 let w=rot(flow(p,vec3<f32>(0.)).p);
 var o:LOut;o.position=project(w);o.alpha=u.topo.w*fade*(.55+.45*clamp(.5-w.z*.2,0.,1.));return o;
}
@fragment fn latticeFragment(@location(0) alpha: f32) -> @location(0) vec4<f32> {
 let ink=mix(vec3<f32>(.30,.25,.18),vec3<f32>(.86,.76,.56),u.par.y);return vec4<f32>(ink*alpha,alpha);
}`;
function makeWebGL(canvas,count){
  const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:false});
  if(!gl)throw new Error('WebGL2 is unavailable');
  const shaders=[],programs=[];
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(message);}shaders.push(s);return s;}
  function link(vertex,fragment){const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));programs.push(program);return {program,location:gl.getUniformLocation(program,'u')};}
  const tube=link(GLSL_VERTEX,GLSL_FRAGMENT),lattice=link(GLSL_LATTICE_VERTEX,GLSL_LATTICE_FRAGMENT),vao=gl.createVertexArray();
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.clearColor(0,0,0,0);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  return {name:'WebGL2',resize(w,h){gl.viewport(0,0,w,h);},draw(uniforms){
    if(gl.isContextLost())return;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.bindVertexArray(vao);
    gl.useProgram(tube.program);gl.uniform4fv(tube.location,uniforms);gl.drawArrays(gl.TRIANGLES,0,count);
    if(uniforms[23]>.003){gl.useProgram(lattice.program);gl.uniform4fv(lattice.location,uniforms);gl.enable(gl.BLEND);gl.depthMask(false);
      gl.drawArrays(gl.LINES,0,LATTICE_VERTICES);gl.depthMask(true);gl.disable(gl.BLEND);}
  },destroy(){gl.deleteVertexArray(vao);programs.forEach(p=>gl.deleteProgram(p));shaders.forEach(s=>gl.deleteShader(s));}};
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
    const module=device.createShaderModule({code:WGSL}),multisample={count:4};
    const over={operation:'add',srcFactor:'one',dstFactor:'one-minus-src-alpha'};
    const[pipeline,latticePipeline]=await Promise.all([
      device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vertexMain'},fragment:{module,entryPoint:'fragmentMain',targets:[{format}]},primitive:{topology:'triangle-list'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'},multisample}),
      device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'latticeVertex'},fragment:{module,entryPoint:'latticeFragment',targets:[{format,blend:{color:over,alpha:over}}]},primitive:{topology:'line-list'},depthStencil:{format:'depth24plus',depthWriteEnabled:false,depthCompare:'less'},multisample})]);
    const bind=p=>device.createBindGroup({layout:p.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniformBuffer}}]});
    const group=bind(pipeline),latticeGroup=bind(latticePipeline);let depth=null,msaa=null;
    device.lost.then(info=>{if(info.reason!=='destroyed')onLost();});
    return {name:'WebGPU',resize(w,h){depth?.destroy();msaa?.destroy();
      depth=device.createTexture({size:[w,h],format:'depth24plus',sampleCount:4,usage:GPUTextureUsage.RENDER_ATTACHMENT});
      msaa=device.createTexture({size:[w,h],format,sampleCount:4,usage:GPUTextureUsage.RENDER_ATTACHMENT});},draw(uniforms){
      if(!depth)return;device.queue.writeBuffer(uniformBuffer,0,uniforms);
      const encoder=device.createCommandEncoder();const pass=encoder.beginRenderPass({colorAttachments:[{view:msaa.createView(),resolveTarget:context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:'clear',storeOp:'discard'}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'discard'}});
      pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.draw(count);
      if(uniforms[23]>.003){pass.setPipeline(latticePipeline);pass.setBindGroup(0,latticeGroup);pass.draw(LATTICE_VERTICES);}
      pass.end();device.queue.submit([encoder.finish()]);
    },destroy(){depth?.destroy();msaa?.destroy();uniformBuffer.destroy();context.unconfigure();device.destroy();}};
  }catch(error){device.destroy();throw error;}
}
const DEFAULTS={writhe:.35,warp:.3,pulse:.3,thickness:.235,speed:1,pull:.7};
const MAX_PQ=13;
const gcd=(a,b)=>b?gcd(b,a%b):a;
const NAMES={'2,3':['trefoil','三叶结'],'2,5':['cinquefoil','五叶结'],'2,7':['knot 7₁','7₁ 纽结'],'3,4':['knot 8₁₉','8₁₉ 纽结'],'3,5':['knot 10₁₂₄','10₁₂₄ 纽结']};
function describe(p,q,zh){
  const d=gcd(p,q);if(d>1)return zh?`${d} 分支环链`:`${d}-component link`;
  if(p===1||q===1)return zh?'平凡结':'unknot';
  const name=NAMES[`${Math.min(p,q)},${Math.max(p,q)}`];return name?name[zh?1:0]:(zh?'环面纽结':'torus knot');
}
const AUTO_SPIN=.00012;
export async function initializeSculpture(){
  const stage=document.getElementById('sculpture-stage');if(!stage)return null;
  let canvas=document.getElementById('sculpture-canvas'),renderer=null,raf=0,last=0,time=0,visible=true,disposed=false;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduce.matches;
  try{paused=reduce.matches||localStorage.getItem('invariant:motion')==='paused';}catch{}
  const view={yaw:.24,pitch:.62,vyaw:0,vpitch:0},roll=-.32;
  const knot={from:[2,3],to:[2,3],morph:1};
  const reduced=([p,q])=>{const d=gcd(p,q);return[p/d,q/d,d];},density=([p,q])=>Math.min(1,5.5/Math.max(p,q));
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
    const m=ease(knot.morph),a=reduced(knot.from),b=reduced(knot.to),thin=density(knot.from)*(1-m)+density(knot.to)*m;
    uniforms.set([view.pitch,view.yaw,roll,canvas.width/canvas.height,.27*Math.min(1,canvas.width/canvas.height*1.1),document.documentElement.dataset.theme==='dark'?1:0,time,pointer.s,
      a[0],a[1],b[0],b[1],m,settings.thickness*thin,settings.writhe,settings.pulse,pointer.x,pointer.y,segs,sides,a[2],b[2],settings.warp,Math.min(1,settings.warp*4)*.3]);
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
  const onLanguage=()=>changeLanguage();document.addEventListener('invariant:language',onLanguage);
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

  const presets=[...(panel?.querySelectorAll('[data-knot]')||[])],inputP=document.getElementById('knot-p'),inputQ=document.getElementById('knot-q'),note=document.getElementById('knot-note');
  function describeCurrent(){
    const[p,q]=knot.to,zh=document.documentElement.lang==='zh-CN';if(note)note.textContent=describe(p,q,zh);
    presets.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.knot===`${p},${q}`)));
  }
  function setKnot(p,q){
    p=Math.max(1,Math.min(MAX_PQ,Math.round(p)));q=Math.max(1,Math.min(MAX_PQ,Math.round(q)));
    if(p===knot.to[0]&&q===knot.to[1])return;
    const current=knot.morph>.5?knot.to:knot.from;
    knot.from=[...current];knot.to=[p,q];knot.morph=0;
    if(meta)meta.textContent=`T(${p}, ${q})`;
    if(inputP&&document.activeElement!==inputP)inputP.value=p;if(inputQ&&document.activeElement!==inputQ)inputQ.value=q;
    stage.setAttribute('aria-label',`A writhing (${p},${q}) torus ${gcd(p,q)>1?'link':'knot'} carried by a smooth deformation of space`);
    describeCurrent();pointer.vs+=4;kick();
  }
  for(const button of presets)button.addEventListener('click',()=>{const[p,q]=button.dataset.knot.split(',').map(Number);setKnot(p,q);});
  for(const input of[inputP,inputQ].filter(Boolean)){
    const apply=()=>{const p=Number(inputP.value),q=Number(inputQ.value);if(Number.isInteger(p)&&Number.isInteger(q)&&p>=1&&q>=1&&p<=MAX_PQ&&q<=MAX_PQ)setKnot(p,q);};
    input.addEventListener('input',apply);
    input.addEventListener('change',()=>{input.value=knot.to[input===inputP?0:1];});
    input.addEventListener('keydown',event=>{if(event.key==='Enter')input.blur();});
  }
  const changeLanguage=()=>{updateButtons();describeCurrent();};describeCurrent();
  const sliders=[...(panel?.querySelectorAll('input[type=range]')||[])];
  function showValue(input){const out=panel.querySelector(`output[for="${input.id}"]`);if(out)out.textContent=Number(input.value).toFixed(2);}
  for(const input of sliders){
    input.value=settings[input.name];showValue(input);
    input.addEventListener('input',()=>{settings[input.name]=Number(input.value);showValue(input);if(input.name==='pull'){pointer.vs+=2;}kick();});
  }
  panel?.querySelector('[data-reset]')?.addEventListener('click',()=>{
    Object.assign(settings,DEFAULTS);sliders.forEach(input=>{input.value=settings[input.name];showValue(input);});
    setKnot(2,3);if(inputP)inputP.value=2;if(inputQ)inputQ.value=3;
    view.yaw=.24;view.pitch=.62;kick();
  });

  updateButtons();sync();return {toggleMotion:toggle,get backend(){return renderer?.name||'SVG';},destroy(){disposed=true;stop();ro.disconnect();io.disconnect();renderer?.destroy();document.removeEventListener('visibilitychange',sync);document.removeEventListener('invariant:theme',changeTheme);document.removeEventListener('invariant:language',onLanguage);reduce.removeEventListener('change',reducedChanged);}};
}
