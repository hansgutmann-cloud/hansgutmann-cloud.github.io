import {compile,interpret} from './core/compiler.js';
import {simulateCache,roundRobin} from './core/systems.js';
import {verify} from './core/algebra.js';
/** A dedicated worker isolates bounded experiments from DOM work. No network requests. */
self.onmessage=async({data})=>{
  const {id,kind,payload}=data;const start=performance.now();
  try{
    let result;
    if(kind==='compile'){
      const p=compile(payload.source),reference=interpret(p.original,payload.input);
      let value=reference,backend='i32 interpreter',reason='';
      try{
        const {instance}=await WebAssembly.instantiate(p.bytes);
        value=instance.exports.compute(payload.input);backend='WebAssembly';
      }catch(error){reason=error.message;}
      if(value!==reference)throw new Error('Interpreter/Wasm equivalence check failed.');
      result={ir:p.ir,optimizedIR:p.optimizedIR,wat:p.wat,bytes:p.bytes,value,backend,reason,
        before:p.original.instructions.length,after:p.optimized.instructions.length,stats:p.optimized.stats};
    }else if(kind==='cache')result=simulateCache(payload);
    else if(kind==='scheduler')result=roundRobin(undefined,payload.quantum);
    else if(kind==='algebra')result=verify();
    else throw new Error('Unknown experiment.');
    self.postMessage({id,result,elapsed:performance.now()-start});
  }catch(error){self.postMessage({id,error:error.message});}
};
