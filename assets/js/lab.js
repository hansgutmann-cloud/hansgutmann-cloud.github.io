import {t,getLanguage,escape} from './ui.js';
import {EXAMPLE,compile,interpret} from './core/compiler.js';
import {identity,a,b,compose,indexOf,elements,labels,table,verify} from './core/algebra.js';
import {simulateCache,roundRobin} from './core/systems.js';
const $=id=>document.getElementById(id);
class Engine{
  constructor(){
    this.pending=new Map();this.sequence=0;this.worker=null;
    try{this.worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});
      this.worker.onmessage=({data})=>{const p=this.pending.get(data.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(data.id);data.error?p.reject(new Error(data.error)):p.resolve(data);};
      this.worker.onerror=event=>{event.preventDefault();this.worker?.terminate();this.worker=null;const waiting=[...this.pending.values()];this.pending.clear();this.updateLabel();for(const p of waiting){clearTimeout(p.timer);this.run(p.kind,p.payload).then(p.resolve,p.reject);}};
    }catch{this.worker=null;}this.updateLabel();
  }
  updateLabel(){ $('worker-status').textContent=t(this.worker?'workerLabel':'mainLabel'); }
  async run(kind,payload){
    if(this.worker)return new Promise((resolve,reject)=>{
      const id=++this.sequence,timer=setTimeout(()=>{this.pending.delete(id);this.worker?.terminate();this.worker=null;reject(new Error('Experiment exceeded the execution time limit.'));this.updateLabel();},8000);
      this.pending.set(id,{resolve,reject,timer,kind,payload});this.worker.postMessage({id,kind,payload});
    });
    const start=performance.now();let result;
    if(kind==='compile'){
      const p=compile(payload.source);let value=interpret(p.original,payload.input),backend='i32 interpreter',reason='';
      try{const {instance}=await WebAssembly.instantiate(p.bytes);value=instance.exports.compute(payload.input);backend='WebAssembly';}catch(error){reason=error.message;}
      if(value!==interpret(p.original,payload.input))throw new Error('Equivalence check failed.');
      result={ir:p.ir,optimizedIR:p.optimizedIR,wat:p.wat,bytes:p.bytes,value,backend,reason,before:p.original.instructions.length,after:p.optimized.instructions.length,stats:p.optimized.stats};
    }else if(kind==='cache')result=simulateCache(payload);
    else if(kind==='scheduler')result=roundRobin(undefined,payload.quantum);
    else if(kind==='algebra')result=verify();
    else throw new Error('Unknown experiment');
    return {result,elapsed:performance.now()-start};
  }
}
function rovingTabs(nodes,onSelect){
  for(const node of nodes)node.addEventListener('keydown',event=>{
    const index=nodes.indexOf(node);let target;
    if(event.key==='ArrowRight')target=(index+1)%nodes.length;
    if(event.key==='ArrowLeft')target=(index-1+nodes.length)%nodes.length;
    if(event.key==='Home')target=0;if(event.key==='End')target=nodes.length-1;
    if(target!==undefined){event.preventDefault();nodes[target].focus();onSelect(nodes[target]);}
  });
}
export async function initializeLab(){
  const engine=new Engine();let active='compiler',lastCompile=null,outputKey='optimizedIR',compileEpoch=0;
  let currentGroup=[...identity],cache=null,cacheTimer=0,cacheEpoch=0,schedulerEpoch=0,groupVerified=false;
  const tabButtons=[...document.querySelectorAll('[data-lab]')],outputButtons=[...document.querySelectorAll('[data-output]')];
  function showOutput(button){
    outputKey=button.dataset.output;
    for(const b of outputButtons){const selected=b===button;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;}
    $('compiler-output').setAttribute('aria-labelledby',button.id);
    $('compiler-output').textContent=lastCompile?lastCompile[outputKey]:'// Run the compiler to inspect the result.';
  }
  outputButtons.forEach(button=>button.addEventListener('click',()=>showOutput(button)));rovingTabs(outputButtons,showOutput);
  async function runCompiler(){
    const epoch=++compileEpoch,button=$('compile-button'),message=$('compile-message');
    message.classList.remove('error');message.textContent=t('running');button.disabled=true;
    try{
      const inputText=$('compiler-input').value.trim(),input=Number(inputText);
      if(!inputText||!Number.isInteger(input)||input<-2147483648||input>2147483647)throw new Error('Input must be a signed 32-bit integer.');
      const {result}=await engine.run('compile',{source:$('source-code').value,input});
      if(epoch!==compileEpoch)return;lastCompile=result;
      $('compiler-output').textContent=result[outputKey];$('compiler-output').classList.remove('code-updated');void $('compiler-output').offsetWidth;$('compiler-output').classList.add('code-updated');
      $('compile-metric').textContent=`${result.before} → ${result.after} ${t('instructions')} / ${result.bytes.length} B`;
      $('compiler-result').textContent=String(result.value);$('compiler-detail').textContent=`${result.backend} · ${result.stats.cse} CSE · ${result.stats.folded} folds`;
      message.textContent=t(result.backend==='WebAssembly'?'runSuccess':'fallbackSuccess');$('download-wasm').disabled=false;
    }catch(error){
      if(epoch!==compileEpoch)return;lastCompile=null;message.classList.add('error');message.textContent=`${t('compileError')}: ${error.message}`;
      $('compiler-result').textContent='—';$('compiler-detail').textContent='';$('compile-metric').textContent='NO BINARY EMITTED';$('download-wasm').disabled=true;
      $('compiler-output').textContent='// Fix the source and compile again. No code was executed.';
    }finally{if(epoch===compileEpoch)button.disabled=false;}
  }
  $('compile-button').addEventListener('click',runCompiler);
  $('source-code').addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();runCompiler();}});
  $('compiler-input').addEventListener('change',runCompiler);
  $('reset-code').addEventListener('click',()=>{$('source-code').value=EXAMPLE;$('compiler-input').value=7;runCompiler();});
  $('download-wasm').addEventListener('click',()=>{
    if(!lastCompile)return;const blob=new Blob([lastCompile.bytes],{type:'application/wasm'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='expression.wasm';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  function drawGroup(){
    const points=[[240,32],[386,235],[94,235],[386,101],[240,302],[94,101]],active=indexOf(currentGroup);
    const edges=[];
    for(let i=0;i<6;i++){
      const j=indexOf(compose(elements[i],a)),p=points[i],q=points[j],dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy);
      edges.push(`<path class="group-edge" d="M${p[0]+dx/length*23} ${p[1]+dy/length*23} L${q[0]-dx/length*26} ${q[1]-dy/length*26}" marker-end="url(#arrow-a)"/>`);
      const k=indexOf(compose(elements[i],b));if(i<k){const r=points[k];edges.push(`<path class="group-edge group-edge-b" d="M${p[0]} ${p[1]} L${r[0]} ${r[1]}"/>`);}
    }
    $('cayley-graph').setAttribute('viewBox','0 0 480 335');
    $('cayley-graph').innerHTML=`<defs><marker id="arrow-a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L7 4L1 7" fill="none" stroke="#91a184" stroke-width="1"/></marker></defs>${edges.join('')}${points.map((p,i)=>`<circle class="group-node ${i===active?'active':''}" cx="${p[0]}" cy="${p[1]}" r="21"/><text class="group-node-text ${i===active?'active':''}" x="${p[0]}" y="${p[1]}">${labels[i]}</text>`).join('')}`;
    $('group-element').textContent=labels[active];$('group-permutation').textContent=`[${currentGroup.map(n=>n+1).join(', ')}]`;
    $('group-table').innerHTML=`<table><caption class="sr-only">S3 multiplication table; row ∘ column</caption><thead><tr><th scope="col">∘</th>${labels.map(n=>`<th scope="col">${n}</th>`).join('')}</tr></thead><tbody>${table().map((row,i)=>`<tr><th scope="row">${labels[i]}</th>${row.map(j=>`<td>${labels[j]}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  $('group-a').addEventListener('click',()=>{currentGroup=compose(currentGroup,a);drawGroup();});
  $('group-b').addEventListener('click',()=>{currentGroup=compose(currentGroup,b);drawGroup();});
  $('group-reset').addEventListener('click',()=>{currentGroup=[...identity];drawGroup();});
  async function initAlgebra(){
    drawGroup();if(groupVerified)return;
    try{const {result}=await engine.run('algebra',{});groupVerified=result.associativity===216&&result.closure&&result.inverses&&result.presentation;
      $('group-check').textContent=groupVerified?t('verifiedGroup'):'Verification failed.';
    }catch(error){$('group-check').textContent=error.message;}
  }
  const cells=[];for(let i=0;i<256;i++){const cell=document.createElement('span');cell.className='memory-cell';cell.title=`address ${i} / row ${Math.floor(i/16)}, column ${i%16}`;cell.setAttribute('aria-hidden','true');cells.push(cell);$('memory-matrix').append(cell);}
  function drawCache(step){
    if(!cache)return;step=Math.min(256,Math.max(0,step));$('cache-step').value=String(step);
    const current=step?cache.trace[step-1]:null,visited=new Set(cache.trace.slice(0,step).map(t=>t.address));
    for(let i=0;i<cells.length;i++)cells[i].className='memory-cell'+(visited.has(i)?' visited':'')+(current?.address===i?(current.hit?' current-hit':' current-miss'):'');
    const tags=current?.tags||Array(8).fill(null);
    $('cache-lines').innerHTML=tags.map((tag,i)=>`<div class="cache-line ${current?.index===i?'active':''}"><span>L${i}</span><strong>${tag===null?'EMPTY':`tag ${tag}`}</strong></div>`).join('');
    $('cache-hits').textContent=String(current?.hits||0);$('cache-misses').textContent=String(current?.misses||0);$('cache-rate').textContent=current?`${Math.round(current.hits/step*100)}%`:'—';
    $('cache-step-label').textContent=`ACCESS ${step} / 256`;
    $('cache-address').textContent=current?`ADDR ${current.address} / ${current.hit?'HIT':'MISS'}`:'ADDRESS —';
  }
  function stopCache(){if(cacheTimer)clearInterval(cacheTimer);cacheTimer=0;$('cache-play').textContent=t('playTrace');}
  async function loadCache(){
    stopCache();const epoch=++cacheEpoch;
    try{const {result}=await engine.run('cache',{order:$('cache-order').value,lineSize:Number($('cache-size').value)});if(epoch!==cacheEpoch)return;cache=result;drawCache(40);}
    catch(error){$('cache-address').textContent=error.message;}
  }
  $('cache-order').addEventListener('change',loadCache);$('cache-size').addEventListener('change',loadCache);
  $('cache-step').addEventListener('input',event=>{stopCache();drawCache(Number(event.target.value));});
  $('cache-next').addEventListener('click',()=>{stopCache();drawCache(Number($('cache-step').value)+1);});
  $('cache-play').addEventListener('click',()=>{
    if(cacheTimer){stopCache();return;}if(!cache)return;
    if(Number($('cache-step').value)>=256)drawCache(0);$('cache-play').textContent=t('pauseTrace');
    cacheTimer=setInterval(()=>{const step=Number($('cache-step').value)+1;drawCache(step);if(step>=256)stopCache();},35);
  });
  async function loadScheduler(){
    const quantum=Number($('quantum').value),epoch=++schedulerEpoch;$('quantum-value').textContent=`${quantum} ticks`;
    try{const {result}=await engine.run('scheduler',{quantum});if(epoch!==schedulerEpoch)return;
      $('scheduler-timeline').innerHTML=`<div class="scheduler-chart">${['A','B','C'].map(id=>`<div class="schedule-row"><span class="schedule-label">${id}</span><div class="schedule-track">${result.trace.filter(t=>t.id===id).map(t=>`<div class="schedule-block job-${id}" style="left:${t.start/result.total*100}%;width:${t.duration/result.total*100}%" title="${id}: [${t.start}, ${t.end}), remaining ${t.remaining}; ready before slice: ${t.readyBefore.join(',')||'empty'}" aria-label="Job ${id}, tick ${t.start} to ${t.end}, ${t.remaining} ticks remaining">${t.start}–${t.end}</div>`).join('')}</div></div>`).join('')}<div class="schedule-scale">${Array.from({length:18},(_,i)=>`<span>${i}</span>`).join('')}</div></div>`;
      $('scheduler-stats').innerHTML=`<span>${t('meanWait')}: <strong>${result.averageWait.toFixed(2)} ticks</strong></span>${result.finished.sort((a,b)=>a.id.localeCompare(b.id)).map(j=>`<span>${j.id}: ${t('wait')} <strong>${j.wait}</strong> / ${t('finish')} ${j.finish}</span>`).join('')}`;
    }catch(error){$('scheduler-stats').textContent=error.message;}
  }
  $('quantum').addEventListener('input',loadScheduler);
  function select(name){
    if(!['compiler','algebra','cache','scheduler'].includes(name))return;active=name;stopCache();
    for(const button of tabButtons){const yes=button.dataset.lab===name;button.setAttribute('aria-selected',String(yes));button.tabIndex=yes?0:-1;$(`panel-${button.dataset.lab}`).hidden=!yes;}
    if(name==='algebra')initAlgebra();if(name==='cache'&&!cache)loadCache();if(name==='scheduler')loadScheduler();
  }
  for(const button of tabButtons)button.addEventListener('click',()=>select(button.dataset.lab));
  rovingTabs(tabButtons,b=>select(b.dataset.lab));
  function localize(){
    engine.updateLabel();const options=$('cache-order').options;['rowWalk','columnWalk','blockedWalk'].forEach((key,i)=>options[i].textContent=t(key));
    $('cache-play').textContent=t(cacheTimer?'pauseTrace':'playTrace');
    if(lastCompile){$('compile-metric').textContent=`${lastCompile.before} → ${lastCompile.after} ${t('instructions')} / ${lastCompile.bytes.length} B`;$('compile-message').textContent=t(lastCompile.backend==='WebAssembly'?'runSuccess':'fallbackSuccess');}
    if(groupVerified)$('group-check').textContent=t('verifiedGroup');if(active==='scheduler')loadScheduler();
  }
  document.addEventListener('invariant:language',localize);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCache();});
  const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stopCache();});observer.observe($('lab-container'));
  localize();await runCompiler();return {select,localize,stop:stopCache};
}
