import test from 'node:test';
import assert from 'node:assert/strict';
import {compile,interpret,EXAMPLE} from '../assets/js/core/compiler.js';
import {simulateCache,roundRobin,DEFAULT_JOBS} from '../assets/js/core/systems.js';
import * as group from '../assets/js/core/algebra.js';
async function compare(source,input){
  const p=compile(source);assert.ok(WebAssembly.validate(p.bytes));
  const {instance}=await WebAssembly.instantiate(p.bytes);
  const expected=interpret(p.original,input);
  assert.equal(interpret(p.optimized,input),expected);
  assert.equal(instance.exports.compute(input),expected);return p;
}
test('sample compiles, optimizes and executes to 112',async()=>{
  const p=await compare(EXAMPLE,7);assert.equal(interpret(p.original,7),112);
  assert.ok(p.optimized.instructions.length<p.original.instructions.length);
  assert.ok(p.optimized.stats.cse>0);assert.ok(p.optimized.stats.dead>0);
});
test('signed i32 overflow, negative literals, identities and CSE',async()=>{
  const cases=['return 2147483647 + 1;','return -2147483648;','return input * 2147483647;','return (input - input) * 7;',
    'return input * 0 + 1 * input;','let a = 8 * input; let b = input * 8; return a - b;',
    'return 4294967295;','return -(-input);','return input - (input - 4);'];
  for(const s of cases)for(const x of [-2147483648,-1,0,1,7,2147483647])await compare(s,x);
});
test('512 generated expressions agree with reference interpreter',async()=>{
  let seed=173;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
  const expr=depth=>depth===0||random()<.3?(random()<.5?'input':String(Math.floor(random()*40))):`(${expr(depth-1)} ${['+','-','*'][Math.floor(random()*3)]} ${expr(depth-1)})`;
  for(let i=0;i<512;i++)await compare(`return ${expr(4)};`,(random()*4294967296)|0);
});
test('parser rejects invalid, malicious or excessive input',()=>{
  for(const s of ['return nope;','let input = 7; return input;','let x=1; let x=2; return x;',
    'return alert(1);','return 3 / 2;','return 4294967296;','return 1; return 2;','return "x";',
    'return '+ '('.repeat(55)+'1'+')'.repeat(55)+';','x'.repeat(4097),'return ;'])assert.throws(()=>compile(s));
});
test('S3 table, inverses, all associativity triples, and noncommutativity',()=>{
  const r=group.verify();assert.equal(r.associativity,216);assert.equal(r.order,6);
  assert.ok(r.closure&&r.inverses&&r.presentation&&r.noncommutative);
  for(const row of group.table())assert.equal(new Set(row).size,6);
});
test('cold direct-mapped cache row/column reference counts',()=>{
  const row=simulateCache(),col=simulateCache({order:'column'});
  assert.equal(row.hits,192);assert.equal(row.misses,64);assert.equal(col.hits,0);assert.equal(col.misses,256);
  for(const order of ['row','column','blocked']){const s=simulateCache({order,lineSize:8});assert.equal(s.hits+s.misses,256);assert.equal(new Set(s.trace.map(x=>x.address)).size,256);}
});
test('RR conserves all bursts and observes arrivals for every quantum',()=>{
  for(let q=1;q<=10;q++){
    const r=roundRobin(undefined,q);assert.equal(r.total,17);assert.equal(r.finished.length,3);
    for(const job of DEFAULT_JOBS){assert.equal(r.trace.filter(t=>t.id===job.id).reduce((s,t)=>s+t.duration,0),job.burst);
      assert.ok(r.trace.filter(t=>t.id===job.id).every(t=>t.start>=job.arrival&&t.duration<=q));}
    assert.ok(r.finished.every(j=>j.wait>=0));
  }
});
test('RR includes idle time and validates inputs',()=>{
  assert.equal(roundRobin([{id:'A',arrival:5,burst:2}],1).total,7);
  assert.equal(roundRobin([],2).total,0);
  assert.throws(()=>roundRobin(undefined,0));assert.throws(()=>simulateCache({lineSize:3}));
});
