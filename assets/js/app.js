import {site} from '../../content/site.mjs';
import {t,getLanguage,escape} from './ui.js';
const $=id=>document.getElementById(id);
let language=site.defaultLanguage,lab=null,labPromise=null,sculpture=null,detail=null;
try{const saved=localStorage.getItem('invariant:language');if(['en','zh'].includes(saved))language=saved;}catch{}
const store=(key,value)=>{try{localStorage.setItem(`invariant:${key}`,value);}catch{}};
function safeUrl(value){
  if(typeof value!=='string'||!value)return null;
  try{const url=new URL(value,location.href);if(['https:','http:','mailto:'].includes(url.protocol))return url.href;}catch{}return null;
}
function articleContent(item,kind,withTitle=true){
  const n=item[getLanguage()],paragraphs=n.paragraphs||n.detail;
  return `${withTitle?`<h1>${escape(n.title)}</h1><p class="article-lede">${escape(n.summary||n.description)}</p>`:''}${paragraphs.map(p=>`<p>${escape(p)}</p>`).join('')}${n.code?`<pre><code>${escape(n.code)}</code></pre>`:''}${(item.links||[]).filter(l=>safeUrl(l.url)).map(l=>`<p><a href="${escape(safeUrl(l.url))}" target="_blank" rel="noopener noreferrer">${escape(l.label)} ↗</a></p>`).join('')}`;
}
function applyLanguage(){
  document.documentElement.lang=language==='zh'?'zh-CN':'en';
  for(const node of document.querySelectorAll('[data-ui]')){const text=t(node.dataset.ui);node.textContent=text;if(text.includes('\n'))node.style.whiteSpace='pre-line';}
  for(const node of document.querySelectorAll('[data-copy]'))node.textContent=site[language][node.dataset.copy]||'';
  for(const node of document.querySelectorAll('[data-hero-line]'))node.textContent=site[language].heroLines[Number(node.dataset.heroLine)];
  $('language-toggle').textContent=language==='en'?'中':'EN';$('language-toggle').setAttribute('aria-label',t('languageName'));
  for(const node of document.querySelectorAll('[data-work]')){
    const item=site.work.find(w=>w.id===node.dataset.work),n=item[language];
    node.querySelector('.card-kind').textContent=n.label;node.querySelector('h3').innerHTML=`${escape(n.title)} <span class="card-arrow" aria-hidden="true">↗</span>`;node.querySelector('.work-copy p').textContent=n.description;
  }
  for(const node of document.querySelectorAll('[data-note]')){
    const item=site.notes.find(n=>n.id===node.dataset.note)[language];node.querySelector('h3').textContent=item.title;node.querySelector('.note-copy p').textContent=item.summary;
  }
  const article=document.querySelector('[data-article-id]');
  if(article){const kind=article.dataset.articleKind,item=(kind==='note'?site.notes:site.work).find(n=>n.id===article.dataset.articleId),n=item[language];article.querySelector('h1').textContent=n.title;article.querySelector('.article-lede').textContent=n.summary||n.description;$('article-body').innerHTML=articleContent(item,kind,false);document.title=`${n.title} · ${site.name}`;}
  if(detail&&$('detail-dialog')?.open)fillDetail(detail.kind,detail.id);
  if($('command-input'))$('command-input').placeholder=t('commandPlaceholder');
  if(!site.email){const contact=document.querySelector('.contact-link');if(contact)contact.innerHTML=`${t('githubContact')} <span aria-hidden="true">↗</span>`;}
  document.dispatchEvent(new Event('invariant:language'));
}
function toggleTheme(){
  const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;store('theme',next);
  document.querySelector('meta[name="theme-color"]').content=next==='dark'?'#16231e':'#f5f3ec';document.dispatchEvent(new Event('invariant:theme'));
}
$('theme-toggle')?.addEventListener('click',toggleTheme);
$('language-toggle')?.addEventListener('click',()=>{language=language==='en'?'zh':'en';store('language',language);applyLanguage();});
applyLanguage();
function fillDetail(kind,id){
  const item=(kind==='note'?site.notes:site.work).find(n=>n.id===id);if(!item)return;
  detail={kind,id};$('detail-category').textContent=item.category||item[language].label;
  $('detail-content').innerHTML=articleContent(item,kind)+`<a class="permalink" href="./${kind}-${escape(id)}.html">${t('openPage')}</a>`;
  $('detail-dialog').setAttribute('aria-label',item[language].title);
}
const detailDialog=$('detail-dialog');
if(detailDialog){
  for(const link of document.querySelectorAll('[data-detail]'))link.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
    event.preventDefault();const[kind,id]=link.dataset.detail.split(':');fillDetail(kind,id);detailDialog.showModal();detailDialog.scrollTop=0;
  });
}
for(const dialog of document.querySelectorAll('dialog')){
  dialog.querySelector('.close-dialog')?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
}
async function getLab(){
  if(lab)return lab;
  if(!labPromise)labPromise=import('./lab.js').then(m=>m.initializeLab()).then(instance=>(lab=instance)).catch(error=>{
    labPromise=null;const status=$('worker-status');if(status)status.textContent='EXPERIMENT LOAD ERROR';throw error;
  });return labPromise;
}
if($('lab')){
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();getLab().catch(()=>{});}},{rootMargin:'240px'});observer.observe($('lab'));
  // Keep the first click usable even on a slow connection, before the lazy module has loaded.
  for(const button of document.querySelectorAll('[data-lab]'))button.addEventListener('click',()=>{if(!lab)getLab().then(x=>x.select(button.dataset.lab)).catch(()=>{});});
  import('./sculpture.js').then(m=>m.initializeSculpture()).then(instance=>{sculpture=instance;}).catch(()=>{$('render-backend').textContent='SVG';});
}
const commandDialog=$('command-dialog');
if(commandDialog){
  let selected=0,filtered=[];
  const go=id=>document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  const commands=()=>[
    {label:t('navWork'),hint:'work',keywords:'research work 研究 论文',run:()=>go('work')},
    {label:t('navNotes'),hint:'notes',keywords:'notes writing 笔记 思考',run:()=>go('notes')},
    {label:t('navAbout'),hint:'about',keywords:'about whoami 关于',run:()=>go('about')},
    ...['compiler','algebra','cache','scheduler'].map(name=>({label:t(name==='cache'?'memory':name),hint:`lab ${name}`,keywords:`playground lab ${name} ${t(name==='cache'?'memory':name)}`,run:async()=>{go('lab');(await getLab()).select(name);}})),
    {label:t(document.documentElement.dataset.theme==='dark'?'themeLight':'themeDark'),hint:'theme',keywords:'theme light dark 主题 浅色 深色',run:toggleTheme},
    {label:t('languageName'),hint:'language',keywords:'language 中文 English 语言',run:()=>{language=language==='en'?'zh':'en';store('language',language);applyLanguage();}},
    {label:t('toggleMotion'),hint:'motion',keywords:'motion pause play 动画 暂停',run:()=>sculpture?.toggleMotion()},
    {label:'GitHub',hint:'open profile ↗',keywords:'github source code 代码',run:()=>window.open(site.github,'_blank','noopener,noreferrer')},
    {label:'Colophon / 设计与实现',hint:'implementation',keywords:'architecture design colophon 原理 源码 架构',run:()=>{location.href='./colophon.html';}},
    ...site.notes.map(note=>({label:note[language].title,hint:note.category.toLowerCase(),keywords:`${note.en.title} ${note.zh.title}`,run:()=>{fillDetail('note',note.id);detailDialog.showModal();}}))
  ];
  function paint(){
    const query=$('command-input').value.trim().toLowerCase();const tokens=query.split(/\s+/).filter(Boolean);
    filtered=commands().filter(c=>tokens.every(s=>(c.label+' '+c.hint+' '+c.keywords).toLowerCase().includes(s)));
    selected=Math.min(Math.max(0,selected),Math.max(filtered.length-1,0));
    $('command-results').innerHTML=filtered.length?filtered.map((c,i)=>`<div class="command-option" id="command-${i}" role="option" aria-selected="${i===selected}" data-index="${i}"><span>${escape(c.label)}</span><span class="mono">${escape(c.hint)}</span></div>`).join(''):`<p class="command-empty">${t('noCommands')}</p>`;
    if(filtered.length)$('command-input').setAttribute('aria-activedescendant',`command-${selected}`);else $('command-input').removeAttribute('aria-activedescendant');
    for(const item of $('command-results').querySelectorAll('[data-index]'))item.addEventListener('click',()=>execute(Number(item.dataset.index)));
  }
  async function execute(index){const command=filtered[index];if(!command)return;commandDialog.close();try{await command.run();}catch{const toast=$('toast');toast.textContent='The experiment could not be loaded. The source remains available in Colophon.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),4000);}}
  function open(){if(commandDialog.open){commandDialog.close();return;}if(detailDialog.open)detailDialog.close();$('command-input').value='';selected=0;paint();commandDialog.showModal();$('command-input').focus();}
  $('command-trigger').addEventListener('click',open);
  document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();open();}});
  $('command-input').addEventListener('input',()=>{selected=0;paint();});
  $('command-input').addEventListener('keydown',event=>{
    if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();if(!filtered.length)return;selected=(selected+(event.key==='ArrowDown'?1:-1)+filtered.length)%filtered.length;paint();$(`command-${selected}`)?.scrollIntoView({block:'nearest'});}
    if(event.key==='Enter'){event.preventDefault();execute(selected);}
  });
  const sections=[...document.querySelectorAll('main section[id]')];
  const activeObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){for(const link of document.querySelectorAll('.main-nav>a')){if(link.getAttribute('href')===`#${entry.target.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}},{rootMargin:'-20% 0px -60% 0px'});sections.forEach(s=>activeObserver.observe(s));
}
