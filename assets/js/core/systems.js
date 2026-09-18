/** Educational trace models. Not performance measurements of the visitor's machine. */
export function simulateCache({ order = 'row', lineSize = 4, size = 16, lines = 8 } = {}) {
  if (!['row','column','blocked'].includes(order) || ![2,4,8,16].includes(lineSize)
      || !Number.isInteger(size) || size < 1 || size > 64 || !Number.isInteger(lines) || lines < 1 || lines > 64)
    throw new Error('Unsupported cache configuration');
  const addresses = [];
  if (order === 'row') for (let r=0;r<size;r++) for (let c=0;c<size;c++) addresses.push(r*size+c);
  if (order === 'column') for (let c=0;c<size;c++) for (let r=0;r<size;r++) addresses.push(r*size+c);
  if (order === 'blocked') for(let br=0;br<size;br+=4) for(let bc=0;bc<size;bc+=4)
    for(let r=br;r<Math.min(br+4,size);r++) for(let c=bc;c<Math.min(bc+4,size);c++) addresses.push(r*size+c);
  const tags = Array(lines).fill(null); let hits=0;
  const trace = addresses.map((address, step) => {
    const block=Math.floor(address/lineSize), index=block%lines, tag=Math.floor(block/lines);
    const hit=tags[index]===tag; if(hit) hits++; tags[index]=tag;
    return { step, address, block, index, tag, hit, hits, misses: step+1-hits, tags: [...tags] };
  });
  return {trace, hits, misses:addresses.length-hits, size, lines, lineSize, order};
}
export const DEFAULT_JOBS = [{id:'A',arrival:0,burst:7},{id:'B',arrival:1,burst:4},{id:'C',arrival:2,burst:6}];
/** RR: arrivals up to the end of a slice are admitted before requeuing the running job. */
export function roundRobin(jobs = DEFAULT_JOBS, quantum = 2) {
  if(!Number.isInteger(quantum)||quantum<1||quantum>10||!Array.isArray(jobs)||jobs.length>16) throw new Error('Invalid scheduler input');
  const pending=jobs.map((j,i)=>{
    if(!Number.isInteger(j.arrival)||j.arrival<0||!Number.isInteger(j.burst)||j.burst<1||j.burst>100) throw new Error('Invalid job');
    return {...j,remaining:j.burst,rank:i};
  }).sort((a,b)=>a.arrival-b.arrival||a.rank-b.rank);
  if(new Set(jobs.map(j=>j.id)).size!==jobs.length) throw new Error('Job IDs must be unique');
  const queue=[],trace=[],finished=[]; let time=0, next=0;
  const admit=()=>{while(next<pending.length&&pending[next].arrival<=time) queue.push(pending[next++]);};
  while(next<pending.length||queue.length){
    if(!queue.length){ time=Math.max(time,pending[next].arrival); admit(); }
    const job=queue.shift(), start=time, duration=Math.min(quantum,job.remaining);
    const ready=queue.map(j=>j.id); time+=duration;job.remaining-=duration;admit();
    trace.push({id:job.id,start,end:time,duration,remaining:job.remaining,readyBefore:ready});
    if(job.remaining) queue.push(job); else finished.push({...job,finish:time,turnaround:time-job.arrival,wait:time-job.arrival-job.burst});
  }
  return {trace, finished, total:time, quantum, averageWait:finished.length?finished.reduce((s,j)=>s+j.wait,0)/finished.length:0};
}
