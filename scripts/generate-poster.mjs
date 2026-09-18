import {tubeVertex,rotatePoint} from '../assets/js/geometry.js';
import {writeFile} from 'node:fs/promises';
const scale=78,width=600,height=540;
const paths=[];
for(let side=0;side<22;side++){
 let d='';for(let j=0;j<=320;j++){
  const p=rotatePoint(tubeVertex(j/320,side/22).slice(0,3));
  d+=(j?'L':'M')+(width/2+p[0]*scale).toFixed(1)+','+(height/2-p[1]*scale).toFixed(1);
 }
 paths.push(`<path d="${d}" stroke="${side%3===0?'#53644f':'#98744b'}" stroke-opacity="${side%3===0?.65:.7}"/>`);
}
await writeFile(new URL('../assets/images/knot.svg',import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><title>A (2,3) torus knot</title><g fill="none" stroke-width=".65">${paths.join('')}</g></svg>`);
