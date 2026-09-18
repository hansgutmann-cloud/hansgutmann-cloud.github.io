import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {once} from 'node:events';
import {createMesh,tubeVertex} from '../assets/js/geometry.js';
import {EXAMPLE} from '../assets/js/core/compiler.js';
test('knot mesh is finite, normalized, and periodic',()=>{
  const mesh=createMesh(24,8);assert.equal(mesh.length,24*8*6*8);assert.ok(mesh.every(Number.isFinite));
  for(const v of [0,.2,.5,.9,1]){
    const p=tubeVertex(0,v),q=tubeVertex(1,v);
    for(let i=0;i<6;i++)assert.ok(Math.abs(p[i]-q[i])<1e-7);
    assert.ok(Math.abs(Math.hypot(...p.slice(3,6))-1)<1e-7);
  }
});
test('original worker protocol executes all four models off-thread',async()=>{
  const worker=new Worker(new URL('./worker-harness.mjs',import.meta.url));
  try{
    const [ready]=await once(worker,'message');assert.ok(ready.ready);
    let id=0;async function run(kind,payload){const response=once(worker,'message');worker.postMessage({id:++id,kind,payload});const [message]=await response;assert.equal(message.id,id);return message;}
    const c=await run('compile',{source:EXAMPLE,input:9});assert.equal(c.result.value,144);assert.equal(c.result.backend,'WebAssembly');
    const cache=await run('cache',{order:'row',lineSize:4});assert.equal(cache.result.hits,192);
    const rr=await run('scheduler',{quantum:2});assert.equal(rr.result.total,17);
    const group=await run('algebra',{});assert.equal(group.result.associativity,216);
    const error=await run('compile',{source:'return nonexistent;',input:1});assert.match(error.error,/Unknown name/);
  }finally{await worker.terminate();}
});
