/** Dependency-free, loopback-only development server. Not intended as a production backend. */
import {createServer} from 'node:http';
import {stat,readFile,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
const project=fileURLToPath(new URL('../',import.meta.url));
const root=resolve(project,process.argv.includes('--dist')?'dist':'.');
const portIndex=process.argv.indexOf('--port');const port=Number(portIndex>=0?process.argv[portIndex+1]:process.env.PORT||5173);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be an integer from 1 to 65535.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ico':'image/x-icon','.wasm':'application/wasm','.json':'application/json','.md':'text/plain; charset=utf-8','.wat':'text/plain; charset=utf-8','.expr':'text/plain; charset=utf-8','.xml':'application/xml','.txt':'text/plain; charset=utf-8','.pdf':'application/pdf'};
createServer(async(req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(path.includes('\0')||path.split('/').some(p=>p.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
    let file=resolve(root,'.'+path);if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
    const s=await stat(file);if(s.isDirectory())file=resolve(file,'index.html');
    file=await realpath(file);if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
    const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(error){res.writeHead(error.code==='ENOENT'?'404':400,{'Content-Type':'text/plain; charset=utf-8'});res.end(error.code==='ENOENT'?'Not found':'Bad request');}
}).listen(port,'127.0.0.1',()=>console.log(`INVARIANT → http://127.0.0.1:${port}\nServing ${root}\nEdit, then refresh. Changes to content/templates: run npm run build.`)).on('error',error=>{console.error(error.message);process.exitCode=1;});
