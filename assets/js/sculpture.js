import {createMesh} from './geometry.js';
/* Both backends render the same geometry. No adapter/device is fingerprinted or logged. */
const GLSL_VERTEX=`#version 300 es
precision highp float;
layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;
layout(location=2) in vec2 uv;
uniform vec4 angles;
uniform vec4 params;
out vec3 vNormal;
out vec2 vUV;
vec3 rotate(vec3 p){
 float c=cos(angles.x),s=sin(angles.x);p=vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);
 c=cos(angles.y);s=sin(angles.y);p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);
 c=cos(angles.z);s=sin(angles.z);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);
}
void main(){vec3 p=rotate(position);gl_Position=vec4(p.x*params.x/angles.w,p.y*params.x,p.z*.12,1.);vNormal=rotate(normal);vUV=uv;}`;
const GLSL_FRAGMENT=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUV;
uniform vec4 params;
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
 shade+=vec3(.19,.15,.09)*rim;
 shade*=1.+params.y*.14;
 color=vec4(shade,1.);
}`;
const WGSL=`
struct Uniforms { angles: vec4<f32>, params: vec4<f32> };
@group(0) @binding(0) var<uniform> u: Uniforms;
struct Input { @location(0) position: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) uv: vec2<f32> };
struct Output { @builtin(position) position: vec4<f32>, @location(0) normal: vec3<f32>, @location(1) uv: vec2<f32> };
fn rotate(point: vec3<f32>) -> vec3<f32> {
 var p=point;var c=cos(u.angles.x);var s=sin(u.angles.x);
 p=vec3<f32>(p.x,p.y*c-p.z*s,p.y*s+p.z*c);
 c=cos(u.angles.y);s=sin(u.angles.y);p=vec3<f32>(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);
 c=cos(u.angles.z);s=sin(u.angles.z);return vec3<f32>(p.x*c-p.y*s,p.x*s+p.y*c,p.z);
}
@vertex fn vertexMain(v: Input) -> Output {
 var o:Output;let p=rotate(v.position);
 o.position=vec4<f32>(p.x*u.params.x/u.angles.w,p.y*u.params.x,p.z*.12+.5,1.);
 o.normal=rotate(v.normal);o.uv=v.uv;return o;
}
@fragment fn fragmentMain(v:Output)->@location(0) vec4<f32>{
 let n=normalize(v.normal);let light=normalize(vec3<f32>(-.55,.8,-1.2));
 let diff=max(dot(n,light),0.);let spec=pow(max(dot(reflect(-light,n),vec3<f32>(0.,0.,-1.)),0.),30.);
 let blend=.19+.15*sin(v.uv.x*6.283185);
 let copper=mix(vec3<f32>(.71,.55,.35),vec3<f32>(.41,.52,.43),blend);
 var shade=copper*(.57+.55*diff)+vec3<f32>(.35,.29,.18)*spec;
 let grid=v.uv*vec2<f32>(152.,24.);
 let edge=abs(fract(grid-.5)-.5)/max(fwidth(grid),vec2<f32>(.0001));
 let wire=1.-smoothstep(.38,1.1,min(edge.x,edge.y));
 shade=mix(shade,shade*.48,wire*.78);
 let rim=pow(1.-abs(n.z),3.);shade+=vec3<f32>(.19,.15,.09)*rim;
 shade*=1.+u.params.y*.14;
 return vec4<f32>(shade,1.);
}`;
function makeWebGL(canvas,data){
  const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:false});
  if(!gl)throw new Error('WebGL2 is unavailable');
  const shaders=[];
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(message);}shaders.push(s);return s;}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,GLSL_VERTEX));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,GLSL_FRAGMENT));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  const buffer=gl.createBuffer(),vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  for(const [index,count,offset]of[[0,3,0],[1,3,12],[2,2,24]]){gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,count,gl.FLOAT,false,32,offset);}
  const angles=gl.getUniformLocation(program,'angles'),params=gl.getUniformLocation(program,'params');
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.clearColor(0,0,0,0);
  return {name:'WebGL2',resize(w,h){gl.viewport(0,0,w,h);},draw(uniforms){
    if(gl.isContextLost())return;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.bindVertexArray(vao);
    gl.uniform4fv(angles,uniforms.subarray(0,4));gl.uniform4fv(params,uniforms.subarray(4,8));gl.drawArrays(gl.TRIANGLES,0,data.length/8);
  },destroy(){gl.deleteBuffer(buffer);gl.deleteVertexArray(vao);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));}};
}
async function makeWebGPU(canvas,data,onLost){
  if(!navigator.gpu)throw new Error('WebGPU is unavailable');
  const adapter=await navigator.gpu.requestAdapter({powerPreference:'low-power'});
  if(!adapter)throw new Error('No WebGPU adapter');
  const device=await adapter.requestDevice();
  try{
    const context=canvas.getContext('webgpu');if(!context)throw new Error('No WebGPU canvas context');
    const format=navigator.gpu.getPreferredCanvasFormat();context.configure({device,format,alphaMode:'premultiplied'});
    const vertexBuffer=device.createBuffer({size:data.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});device.queue.writeBuffer(vertexBuffer,0,data);
    const uniformBuffer=device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    const module=device.createShaderModule({code:WGSL});
    const pipeline=await device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vertexMain',buffers:[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32x3'},{shaderLocation:2,offset:24,format:'float32x2'}]}]},fragment:{module,entryPoint:'fragmentMain',targets:[{format}]},primitive:{topology:'triangle-list'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'}});
    const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniformBuffer}}]});let depth=null;
    device.lost.then(info=>{if(info.reason!=='destroyed')onLost();});
    return {name:'WebGPU',resize(w,h){depth?.destroy();depth=device.createTexture({size:[w,h],format:'depth24plus',usage:GPUTextureUsage.RENDER_ATTACHMENT});},draw(uniforms){
      if(!depth)return;device.queue.writeBuffer(uniformBuffer,0,uniforms);
      const encoder=device.createCommandEncoder();const pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:'clear',storeOp:'store'}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});
      pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.setVertexBuffer(0,vertexBuffer);pass.draw(data.length/8);pass.end();device.queue.submit([encoder.finish()]);
    },destroy(){depth?.destroy();vertexBuffer.destroy();uniformBuffer.destroy();context.unconfigure();device.destroy();}};
  }catch(error){device.destroy();throw error;}
}
export async function initializeSculpture(){
  const stage=document.getElementById('sculpture-stage');if(!stage)return null;
  let canvas=document.getElementById('sculpture-canvas'),renderer=null,raf=0,last=0,elapsed=0,visible=true,disposed=false;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduce.matches;
  try{paused=reduce.matches||localStorage.getItem('invariant:motion')==='paused';}catch{}
  let yaw=.24,pitch=.62;const baseZ=-.32;const uniforms=new Float32Array(8);
  const label=document.getElementById('render-backend'),motion=document.getElementById('motion-toggle');
  const forced=new URLSearchParams(location.search).get('renderer');
  const data=forced==='svg'?null:createMesh(matchMedia('(max-width: 640px)').matches?168:224,28);
  function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
  function lose(){stop();stage.classList.remove('rendering');label.textContent='SVG';renderer?.destroy();renderer=null;updateButtons();}
  function updateButtons(){
    motion.disabled=!renderer;document.getElementById('rotate-sculpture').disabled=!renderer;motion.textContent=paused?'▷':'Ⅱ';motion.setAttribute('aria-pressed',String(paused));
    const zh=document.documentElement.lang==='zh-CN';motion.setAttribute('aria-label',paused?(zh?'播放动画':'Play animation'):(zh?'暂停动画':'Pause animation'));
  }
  function draw(){
    if(!renderer||disposed)return;
    uniforms.set([pitch,yaw+elapsed*.000026,baseZ,canvas.width/canvas.height,.286,document.documentElement.dataset.theme==='dark'?1:0,0,0]);
    try{renderer.draw(uniforms);}catch{lose();}
  }
  function tick(now){
    raf=0;if(disposed||paused||!visible||document.hidden||!renderer)return;
    if(!last)last=now;
    if(now-last>=1000/30){elapsed+=Math.min(now-last,70);last=now;draw();}
    raf=requestAnimationFrame(tick);
  }
  function sync(){stop();if(visible&&!document.hidden)draw();if(!paused&&visible&&!document.hidden&&renderer)raf=requestAnimationFrame(tick);}
  function resize(){
    const box=stage.getBoundingClientRect();if(!box.width||!box.height)return;
    const dpr=Math.min(devicePixelRatio||1,1.75),w=Math.max(1,Math.min(1400,Math.round(box.width*dpr))),h=Math.max(1,Math.min(1400,Math.round(box.height*dpr)));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;renderer?.resize(w,h);}draw();
  }
  function newCanvas(){const next=canvas.cloneNode(false);canvas.replaceWith(next);canvas=next;}
  if(data){
    if(forced!=='webgl2'){try{renderer=await makeWebGPU(canvas,data,lose);}catch{newCanvas();}}
    if(!renderer){try{renderer=makeWebGL(canvas,data);}catch{newCanvas();}}
  }
  if(renderer){label.textContent=renderer.name;stage.classList.add('rendering');canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lose();});}
  else{label.textContent='SVG';paused=true;}
  resize();const ro=new ResizeObserver(resize);ro.observe(stage);
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05});io.observe(stage);
  document.addEventListener('visibilitychange',sync);
  const changeTheme=()=>draw();document.addEventListener('invariant:theme',changeTheme);
  document.addEventListener('invariant:language',updateButtons);
  const reducedChanged=()=>{if(reduce.matches)paused=true;updateButtons();sync();};reduce.addEventListener('change',reducedChanged);
  function toggle(){if(!renderer)return;paused=!paused;try{localStorage.setItem('invariant:motion',paused?'paused':'playing');}catch{}updateButtons();sync();}
  motion.addEventListener('click',toggle);
  document.getElementById('rotate-sculpture').addEventListener('click',()=>{yaw+=Math.PI/6;draw();});
  let drag=null;stage.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0)return;drag={x:event.clientX,y:event.clientY,yaw,pitch};stage.setPointerCapture(event.pointerId);stage.style.cursor='grabbing';});
  stage.addEventListener('pointermove',event=>{if(!drag)return;yaw=drag.yaw+(event.clientX-drag.x)*.008;pitch=drag.pitch+(event.clientY-drag.y)*.006;draw();});
  const release=()=>{drag=null;stage.style.cursor='';};stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
  updateButtons();sync();return {toggleMotion:toggle,get backend(){return renderer?.name||'SVG';},destroy(){disposed=true;stop();ro.disconnect();io.disconnect();renderer?.destroy();document.removeEventListener('visibilitychange',sync);document.removeEventListener('invariant:theme',changeTheme);document.removeEventListener('invariant:language',updateButtons);reduce.removeEventListener('change',reducedChanged);}};
}
