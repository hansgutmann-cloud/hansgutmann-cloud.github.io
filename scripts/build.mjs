import {writeFile,mkdir,rm,cp,stat,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {site} from '../content/site.mjs';
import {home,article,colophon,head,header,footer,escape} from './render.mjs';
import {compile,EXAMPLE} from '../assets/js/core/compiler.js';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=join(root,'dist');
if(!/^https?:\/\//.test(site.url))throw new Error('site.url must be an absolute HTTP(S) URL.');
const ids=[...site.work.map(x=>`work-${x.id}`),...site.notes.map(x=>`note-${x.id}`)];
if(ids.some(id=>!/^[-a-z0-9]+$/.test(id))||new Set(ids).size!==ids.length)throw new Error('Use unique lowercase, hyphen-separated item IDs.');
const pages=new Map([['index.html',home()],['colophon.html',colophon()]]);
for(const n of site.notes)pages.set(`note-${n.id}.html`,article(n,'note'));
for(const w of site.work)pages.set(`work-${w.id}.html`,article(w,'work'));
// GitHub Pages serves this at arbitrary missing paths. Absolute home URL avoids a broken relative link.
const notFoundHead=head('Page not found','This path does not exist.','404.html').replaceAll('href="./assets/',`href="${escape(site.url.replace(/\/$/,''))}/assets/`).replaceAll('src="./assets/',`src="${escape(site.url.replace(/\/$/,''))}/assets/`);
pages.set('404.html',notFoundHead+`<main class="article-page shell" id="main"><p class="eyebrow">404 / NOT FOUND</p><h1>A path, not yet taken.</h1><p class="article-lede">There is no page here. The home page is a good place to continue.</p><a href="${escape(site.url)}/">← Back to ${escape(site.name)}</a></main></body></html>`);
for(const[name,html]of pages)await writeFile(join(root,name),html);
await writeFile(join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...pages.keys()].filter(x=>x!=='404.html').map(name=>`<url><loc>${escape(site.url)}/${name==='index.html'?'':name}</loc></url>`).join('')}</urlset>`);
await writeFile(join(root,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
const sample=compile(EXAMPLE);await mkdir(join(root,'examples'),{recursive:true});
await writeFile(join(root,'examples/expression.expr'),EXAMPLE+'\n');await writeFile(join(root,'examples/expression.wat'),sample.wat+'\n');await writeFile(join(root,'examples/expression.wasm'),sample.bytes);
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
for(const name of [...pages.keys(),'assets','content','examples','.nojekyll','robots.txt','sitemap.xml','README.zh-CN.md','LICENSE']){
  try{await stat(join(root,name));await cp(join(root,name),join(dist,name),{recursive:true});}catch(error){if(error.code!=='ENOENT')throw error;}
}
console.log(`Built ${pages.size} HTML pages + assets → dist/ (root HTML synchronized).`);
