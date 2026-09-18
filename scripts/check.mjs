import {readdir,readFile,access} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));let errors=0,checked=0;
async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){if(['dist','node_modules','.git'].includes(e.name))continue;const p=join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
for(const path of await walk(root)){
  if(/\.(mjs|js)$/.test(path)){const p=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(p.status!==0){console.error(p.stderr);errors++;}checked++;}
  if(!path.endsWith('.html'))continue;const html=await readFile(path,'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(ids.length!==new Set(ids).size){console.error('Duplicate HTML IDs:',path);errors++;}
  for(const match of html.matchAll(/\b(?:src|href)="([^"#]+)(?:#[^"]*)?"/g)){
    const value=match[1].replace(/&amp;/g,'&');if(/^(?:https?:|mailto:|data:|#)/.test(value))continue;
    const target=resolve(dirname(path),value.split('#')[0].split('?')[0]);try{await access(target);}catch{console.error('Missing local link:',path,value);errors++;}
  }
}
if(errors){console.error(`${errors} check(s) failed.`);process.exit(1);}console.log(`Syntax, local links, and HTML IDs passed (${checked} JS modules).`);
