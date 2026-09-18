/**
 * Tiny, bounded compiler: source → tokens → AST → SSA-like IR → optimizations → Wasm.
 * Semantics: pure wrapping signed i32; +, -, *, immutable bindings, one input.
 * No eval, Function constructor, imported Wasm functions, I/O, or arbitrary code.
 */
export const EXAMPLE = `// A small program. A real compiler.\nlet a = input * 8;\nlet b = input * 8;\nlet unused = 12 * 3;\nreturn a + b + 0;`;
const i32 = n => n | 0;
const operate = (op,a,b) => op==='add' ? i32(a+b) : op==='sub' ? i32(a-b) : Math.imul(a,b);

export function tokenize(source) {
  if(typeof source!=='string'||source.length>4096) throw new Error('Source must be at most 4096 characters.');
  const tokens=[];let pos=0;
  while(pos<source.length){
    const rest=source.slice(pos), skip=/^(?:\s+|\/\/[^\n]*(?:\n|$))/.exec(rest);
    if(skip){pos+=skip[0].length;continue;}
    const m=/^(?:[A-Za-z_][A-Za-z0-9_]*|[0-9]+|[+*\-();=])/.exec(rest);
    if(!m) throw new Error(`Unexpected character ${JSON.stringify(source[pos])} at ${pos+1}.`);
    const text=m[0];tokens.push({text,pos,kind:/^[0-9]/.test(text)?'number':/^[A-Za-z_]/.test(text)?'name':'symbol'});
    pos+=text.length;if(tokens.length>512)throw new Error('Program exceeds 512 tokens.');
  }
  tokens.push({text:'<end>',pos,kind:'end'});return tokens;
}
export function parse(source) {
  const tokens=tokenize(source);let cursor=0;
  const peek=()=>tokens[cursor], take=()=>tokens[cursor++];
  const expect=text=>{const t=take();if(t.text!==text)throw new Error(`Expected “${text}” at ${t.pos+1}; found “${t.text}”.`);return t;};
  const precedence={'+':1,'-':1,'*':2};
  function expression(min=0,depth=0){
    if(depth>48)throw new Error('Expression nesting exceeds 48 levels.');
    const token=take();let left;
    if(token.kind==='number'){
      const n=Number(token.text);if(!Number.isSafeInteger(n)||n>4294967295)throw new Error('Decimal literals must fit in 32 bits (0…4294967295).');
      left={kind:'const',value:i32(n)};
    }else if(token.text==='('){left=expression(0,depth+1);expect(')');}
    else if(token.text==='-'){left={kind:'sub',left:{kind:'const',value:0},right:expression(3,depth+1)};}
    else if(token.kind==='name'&&!['let','return'].includes(token.text))left={kind:'name',name:token.text};
    else throw new Error(`Expected an expression at ${token.pos+1}.`);
    while(peek() && (precedence[peek().text]??-1)>=min){
      const op=take().text,right=expression(precedence[op]+1,depth+1);
      left={kind:{'+':'add','-':'sub','*':'mul'}[op],left,right};
    }
    return left;
  }
  const bindings=[];let result;
  while(peek().text==='let'){
    take();const name=take();
    if(name.kind!=='name'||['input','let','return'].includes(name.text))throw new Error('Choose a non-reserved variable name.');
    expect('=');bindings.push({name:name.text,value:expression()});expect(';');
  }
  expect('return');result=expression();expect(';');expect('<end>');
  return {bindings,result};
}
export function lower(ast){
  const instructions=[],env=new Map();
  const emit=instruction=>{const id=instructions.length;instructions.push({id,...instruction});return id;};
  env.set('input',emit({op:'input'}));
  function walk(node){
    if(node.kind==='name'){
      if(!env.has(node.name))throw new Error(`Unknown name “${node.name}”.`);return env.get(node.name);
    }
    if(node.kind==='const')return emit({op:'const',value:node.value});
    return emit({op:node.kind,a:walk(node.left),b:walk(node.right)});
  }
  for(const binding of ast.bindings){
    if(env.has(binding.name))throw new Error(`“${binding.name}” is already bound. Bindings are immutable.`);
    env.set(binding.name,walk(binding.value));
  }
  const result=walk(ast.result);return {instructions,result};
}
export function optimize(ir){
  const out=[],remap=new Map(),seen=new Map();
  const stats={folded:0,identities:0,cse:0,dead:0};
  const add=node=>{const id=out.length;out.push({id,...node});return id;};
  const constant=value=>{
    const key=`const:${value}`;
    if(seen.has(key))return seen.get(key);
    const id=add({op:'const',value});seen.set(key,id);return id;
  };
  for(const ins of ir.instructions){
    let id;
    if(ins.op==='input')id=add({op:'input'});
    else if(ins.op==='const')id=constant(ins.value);
    else{
      let a=remap.get(ins.a),b=remap.get(ins.b);
      const av=out[a].op==='const'?out[a].value:null,bv=out[b].op==='const'?out[b].value:null;
      if(av!==null&&bv!==null){id=constant(operate(ins.op,av,bv));stats.folded++;}
      else if(ins.op==='add'&&(av===0||bv===0)){id=av===0?b:a;stats.identities++;}
      else if(ins.op==='sub'&&bv===0){id=a;stats.identities++;}
      else if(ins.op==='sub'&&a===b){id=constant(0);stats.identities++;}
      else if(ins.op==='mul'&&(av===0||bv===0)){id=constant(0);stats.identities++;}
      else if(ins.op==='mul'&&(av===1||bv===1)){id=av===1?b:a;stats.identities++;}
      else {
        if(['add','mul'].includes(ins.op)&&a>b)[a,b]=[b,a];
        const key=`${ins.op}:${a}:${b}`;
        if(seen.has(key)){id=seen.get(key);stats.cse++;}
        else{id=add({op:ins.op,a,b});seen.set(key,id);}
      }
    }
    remap.set(ins.id,id);
  }
  const result=remap.get(ir.result),live=new Set();
  const mark=id=>{if(live.has(id))return;live.add(id);const n=out[id];if(n.a!==undefined){mark(n.a);mark(n.b);}};
  mark(result);const instructions=out.filter(n=>live.has(n.id));stats.dead=out.length-instructions.length;
  return {instructions,result,stats};
}
export function interpret(ir,input){
  if(!Number.isInteger(input)||input<-2147483648||input>2147483647)throw new Error('Input must be a signed 32-bit integer.');
  const values=new Map();
  for(const n of ir.instructions)values.set(n.id,n.op==='input'?i32(input):n.op==='const'?n.value:operate(n.op,values.get(n.a),values.get(n.b)));
  return values.get(ir.result);
}
const uleb=n=>{const out=[];do{let byte=n&127;n>>>=7;if(n)byte|=128;out.push(byte);}while(n);return out;};
const sleb=value=>{let n=value|0;const out=[];let more=true;while(more){let byte=n&127;n>>=7;more=!((n===0&&!(byte&64))||(n===-1&&(byte&64)));if(more)byte|=128;out.push(byte);}return out;};
const section=(id,body)=>[id,...uleb(body.length),...body];
export function emitWasm(ir){
  const local=new Map(ir.instructions.map((n,i)=>[n.id,i+1]));
  const body=[1,...uleb(ir.instructions.length),0x7f];
  for(const n of ir.instructions){
    if(n.op==='input')body.push(0x20,0);
    else if(n.op==='const')body.push(0x41,...sleb(n.value));
    else body.push(0x20,...uleb(local.get(n.a)),0x20,...uleb(local.get(n.b)),{add:0x6a,sub:0x6b,mul:0x6c}[n.op]);
    body.push(0x21,...uleb(local.get(n.id)));
  }
  body.push(0x20,...uleb(local.get(ir.result)),0x0b);
  const name=[...new TextEncoder().encode('compute')];
  return new Uint8Array([0,97,115,109,1,0,0,0,
    ...section(1,[1,0x60,1,0x7f,1,0x7f]),...section(3,[1,0]),
    ...section(7,[1,...uleb(name.length),...name,0,0]),...section(10,[1,...uleb(body.length),...body])]);
}
export function formatIR(ir){
  return ir.instructions.map(n=>`%${n.id}: i32 = ${n.op==='input'?'input':n.op==='const'?`const ${n.value}`:`${n.op} %${n.a}, %${n.b}`}`).join('\n')+`\nreturn %${ir.result}`;
}
export function formatWat(ir){
  const lines=['(module','  (func (export "compute") (param $input i32) (result i32)'];
  for(const n of ir.instructions)lines.push(`    (local $r${n.id} i32)`);
  for(const n of ir.instructions){
    const v=n.op==='input'?'(local.get $input)':n.op==='const'?`(i32.const ${n.value})`:`(i32.${n.op} (local.get $r${n.a}) (local.get $r${n.b}))`;
    lines.push(`    (local.set $r${n.id} ${v})`);
  }
  lines.push(`    (local.get $r${ir.result})`,'  )',')');return lines.join('\n');
}
export function compile(source){
  const ast=parse(source),original=lower(ast),optimized=optimize(original),bytes=emitWasm(optimized);
  return {ast,original,optimized,bytes,ir:formatIR(original),optimizedIR:formatIR(optimized),wat:formatWat(optimized)};
}
