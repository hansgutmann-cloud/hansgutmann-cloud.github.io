/** Closed tube around the (2,3) torus knot; shared by the GPU mesh and SVG generator. */
export const center = t => [(2+Math.cos(3*t))*Math.cos(2*t),(2+Math.cos(3*t))*Math.sin(2*t),Math.sin(3*t)];
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const normalize=a=>{const m=Math.hypot(...a);return a.map(x=>x/m);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function tubeVertex(u,v){
  const t=u*Math.PI*2,phi=v*Math.PI*2,c=center(t),before=center(t-.0001),after=center(t+.0001);
  const tangent=normalize(after.map((x,i)=>x-before[i]));
  const radial=[Math.cos(2*t),Math.sin(2*t),0],projection=dot(radial,tangent);
  const n=normalize(radial.map((x,i)=>x-projection*tangent[i])),b=cross(tangent,n);
  const normal=n.map((x,i)=>x*Math.cos(phi)+b[i]*Math.sin(phi));
  return [...c.map((x,i)=>x+normal[i]*.235),...normal,u,v];
}
export function createMesh(segments=224,sides=28){
  const data=new Float32Array(segments*sides*6*8);let offset=0;
  const push=(u,v)=>{data.set(tubeVertex(u,v),offset);offset+=8;};
  for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){
    const u=i/segments,v=j/sides,U=(i+1)/segments,V=(j+1)/sides;
    push(u,v);push(U,v);push(U,V);push(u,v);push(U,V);push(u,V);
  }
  return data;
}
export function rotatePoint(p,x=.62,y=.24,z=-.32){
  let [a,b,c]=p;[b,c]=[b*Math.cos(x)-c*Math.sin(x),b*Math.sin(x)+c*Math.cos(x)];
  [a,c]=[a*Math.cos(y)+c*Math.sin(y),-a*Math.sin(y)+c*Math.cos(y)];
  [a,b]=[a*Math.cos(z)-b*Math.sin(z),a*Math.sin(z)+b*Math.cos(z)];return[a,b,c];
}
