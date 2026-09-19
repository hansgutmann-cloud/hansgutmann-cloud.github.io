/** Public content only. After editing, run `npm run build` (no npm install needed).
 * Unknown email/CV/Scholar links are intentionally omitted, not fabricated.
 * Work entries below describe research interests, not publication/award claims.
 */
export const site = {
  name: 'Hans Gutmann',
  initials: 'HG',
  url: 'https://hansgutmann-cloud.github.io',
  github: 'https://github.com/hansgutmann-cloud',
  email: '',
  scholar: '',
  cv: '', // e.g. './assets/cv.pdf' — add your own public PDF first.
  defaultLanguage: 'en',
  defaultTheme: 'light',
  description: 'Hans Gutmann — reinforcement learning, embodied intelligence, and the systems that make them possible.',
  en: {
    role: 'RESEARCHER & SYSTEMS BUILDER',
    heroLines: ['Deep ideas.', 'Grounded', 'systems.'],
    intro: 'I’m Hans. I work across reinforcement learning, embodied intelligence, and the systems that make them possible.',
    subintro: 'From mathematical structure to something that runs.',
    aboutTitle: 'An idea is only the beginning.',
    about: 'I’m interested in the space between a clean abstraction and a working system: how an agent learns, how a program represents intent, and how a machine turns that intent into motion. I like following a question through the layers rather than stopping at their boundaries.',
    philosophy: 'Make the mechanism precise. Make the interface disappear.',
    contact: 'Good questions are a good place to start.',
    contactSub: 'For research, systems, and things worth understanding deeply.',
  },
  zh: {
    role: '研究者 · 系统构建者',
    heroLines: ['深入原理，', '落于', '系统。'],
    intro: '我是 Hans。关注强化学习、具身智能，以及让它们真正运行起来的计算系统。',
    subintro: '从数学结构，到可以运行的事物。',
    aboutTitle: '一个想法，只是开始。',
    about: '我关心优雅抽象与真实系统之间的距离：智能体如何学习，程序如何表达意图，机器又如何把意图变成行动。比起停留在某一层，我更愿意沿着一个问题，追问到它的基础。',
    philosophy: '让机制足够精确，让界面不留负担。',
    contact: '好的合作，从一个好问题开始。',
    contactSub: '关于研究、系统，以及值得深入理解的事物。',
  },
  work: [
    {
      id: 'learning', number: '01', type: 'learning', tags: ['REINFORCEMENT LEARNING', 'EMBODIED AI'],
      en: { label: 'RESEARCH DIRECTION', title: 'Learning, with structure.', description: 'Better interactions. More useful experience. Agents that learn beyond the demonstration.', detail: ['My research interests center on efficient reinforcement learning and embodied intelligence: how to use interaction well, how to explore deliberately, and how to learn behavior that carries into a changing world.', 'This is a research-direction card, not a publication citation. Add your verified paper titles, authors, venues, and links in content/site.mjs before using this section as a publication list.'] },
      zh: { label: '研究方向', title: '让学习具有结构。', description: '更有效的交互，更有价值的经验，以及超越演示的学习能力。', detail: ['关注高效强化学习与具身智能：如何充分利用交互，如何有目的地探索，以及如何学到能够适应变化世界的行为。', '这是一张研究方向卡片，不是论文引文。若要改为论文列表，请先在 content/site.mjs 中填写核实过的标题、作者、会议和链接。'] },
      links: []
    },
    {
      id: 'programs', number: '02', type: 'programs', tags: ['COMPILERS', 'AGENT RUNTIMES'],
      en: { label: 'RESEARCH DIRECTION', title: 'Programs that can reason.', description: 'Explicit state. Composable behavior. A useful boundary between intention and execution.', detail: ['I’m interested in agent runtimes as programs with explicit semantics, rather than opaque chains of prompts: what changes, what must remain invariant, and which effects are allowed to commit.', 'The miniature compiler below follows the same instinct. It makes the representation visible, preserves a precise integer semantics, and emits an executable WebAssembly module rather than a decorative trace.'] },
      zh: { label: '研究方向', title: '让推理成为程序。', description: '显式的状态，可组合的行为，以及意图与执行之间清晰的边界。', detail: ['把智能体运行时看作具有明确语义的程序，而不只是提示词的堆叠：什么发生改变，什么必须保持不变，哪些副作用可以提交。', '下方的小型编译器也遵循这一思路：公开中间表示，保持明确的整数语义，真正生成可执行的 WebAssembly 模块，而不是播放一段装饰性过程。'] },
      links: []
    },
    {
      id: 'systems', number: '03', type: 'systems', tags: ['ARCHITECTURE', 'INFERENCE SYSTEMS'],
      en: { label: 'RESEARCH DIRECTION', title: 'Closer to the metal.', description: 'The shape of a computation matters. So does the machine that carries it.', detail: ['I’m interested in the interaction between algorithms and architecture: data movement, precision, scheduling, and the cost of crossing abstraction boundaries.', 'The cache and scheduler experiments are intentionally small models. Their assumptions are explicit; their traces are reproducible. They are instruments for reasoning, not hardware benchmarks.'] },
      zh: { label: '研究方向', title: '向机器再走近一些。', description: '计算的形状很重要，承载计算的机器也一样。', detail: ['关注算法与体系结构如何相互塑造：数据搬运、数值精度、调度，以及跨越抽象边界的代价。', '缓存和调度实验刻意使用小型模型，公开假设并提供可重现的轨迹。它们是帮助推理的工具，不是硬件性能测试。'] },
      links: []
    }
  ],
  notes: [
    {
      id: 'order', category: 'ALGEBRA', read: '3 MIN',
      en: { title: 'When order matters.', summary: 'A six-element group, and a surprisingly useful habit of thought.', paragraphs: ['Rotate a labeled triangle, then exchange two labels. Reverse the order. The final arrangement need not be the same. That small discrepancy is the point: composition has structure that a list of operations can hide.', 'The laboratory uses S₃, the group of all permutations of three elements. Let a = (123) and b = (12). Then a³ = e, b² = e, and bab = a⁻¹. The six elements are e, a, a², b, ab, and a²b. Throughout this site, (p ∘ q)(i) = p(q(i)); the rightmost permutation acts first.', 'A useful engineering habit follows—not as a theorem about every system, but as a question worth asking: which transformations commute? Reordering memory effects, applying patches, or optimizing a computation all require a semantics that makes the answer meaningful.', 'Try the algebra tab. The page constructs the multiplication table from permutations and checks all 216 associativity triples. No table is hard-coded.'], code: '(p ∘ q)(i) = p(q(i))\na³ = e     b² = e     ab ≠ ba' },
      zh: { title: '当顺序变得重要。', summary: '一个只有六个元素的群，以及一种有用的思考习惯。', paragraphs: ['先旋转一个带标签的三角形，再交换两个标签。反过来做，结果可能不同。正是这点差异，揭示了单纯的操作清单无法表达的复合结构。', '实验室使用三个元素的置换群 S₃。设 a = (123)、b = (12)，则 a³ = e、b² = e、bab = a⁻¹。六个元素为 e、a、a²、b、ab、a²b。本站统一采用 (p ∘ q)(i) = p(q(i))，即最右侧的置换先作用。', '由此可以形成一种工程习惯——并非把群论硬套到所有系统，而是多问一句：哪些变换可以交换次序？重排内存操作、应用补丁、优化计算，都需要清楚的语义来回答。', '打开代数实验。乘法表由置换计算得到，结合律的 216 组输入也会逐一检查，没有硬编码结果。'], code: '(p ∘ q)(i) = p(q(i))\na³ = e     b² = e     ab ≠ ba' }
    },
    {
      id: 'semantics', category: 'COMPILERS', read: '3 MIN',
      en: { title: 'Optimization is a contract.', summary: 'A shorter program is interesting only if its meaning survives.', paragraphs: ['An optimization is a statement about semantics before it is a statement about speed. “Remove x + 0” looks innocent, but the surrounding number system matters. Floating-point values, signed zero, exceptions, and side effects can change what is safe.', 'This site’s expression language deliberately uses one small domain: pure, wrapping signed i32 arithmetic with addition, subtraction, and multiplication. There is one input value, immutable let bindings, and an explicit return. No division, memory effects, arbitrary JavaScript, or hidden coercions.', 'The compiler tokenizes the source, constructs an AST, lowers it to SSA-like instructions, then applies constant folding, algebraic identities, common-subexpression elimination, and dead-code elimination. It emits a real Wasm binary with compute(i32) → i32.', 'The reference interpreter uses the same i32 semantics. Automated tests compare the interpreter and generated Wasm, including overflow and many generated expressions. Fewer instructions are not presented as a measured speedup.'], code: 'let a = input * 8;\nlet b = input * 8;\nreturn a + b + 0;' },
      zh: { title: '优化是一份语义契约。', summary: '程序变短的前提，是它的含义没有丢失。', paragraphs: ['优化首先是关于语义的陈述，其次才是关于速度的陈述。“去掉 x + 0”看似无害，但数值系统很重要：浮点数、带符号零、异常以及副作用，都会改变变换是否安全。', '这里的表达式语言刻意限制在一个小领域：无副作用、溢出回绕的有符号 i32 加减乘运算。它只有一个输入、不可变的 let 绑定和明确的 return；没有除法、内存副作用、任意 JavaScript 或隐式类型转换。', '编译器完成词法分析、AST 构建、SSA 风格指令降级，然后执行常量折叠、代数化简、公共子表达式消除和死代码消除，最终生成 compute(i32) → i32 的真实 Wasm 二进制。', '参考解释器采用相同的 i32 语义。自动化测试比较解释执行与 Wasm 执行，包含溢出和自动生成的表达式。指令变少不被冒充为实测加速。'], code: 'let a = input * 8;\nlet b = input * 8;\nreturn a + b + 0;' }
    },
    {
      id: 'locality', category: 'SYSTEMS', read: '2 MIN',
      en: { title: 'Locality is a design decision.', summary: 'The same arithmetic can take very different paths through memory.', paragraphs: ['An array has a mathematical shape and a physical layout. Those are not the same thing. A row-major matrix stores neighboring columns next to each other, even when the algorithm chooses to walk down a column.', 'The cache laboratory models a 16 × 16 row-major matrix, a cold direct-mapped cache with eight lines, and a configurable line size measured in matrix elements. Every read produces a trace: address, line index, tag, and hit or miss.', 'With four elements per line, a row traversal has 192 hits and 64 misses. A column traversal has no hits under these exact assumptions. Real processors add associativity, prefetching, multiple cache levels, and other effects; this is not a prediction of their runtime.', 'The useful lesson is the method: write down a memory model, examine a trace, and separate what the model establishes from what needs to be measured.'], code: 'block = floor(address / lineSize)\nindex = block mod lineCount\ntag   = floor(block / lineCount)' },
      zh: { title: '局部性，是一种设计选择。', summary: '相同的算术，可以走过完全不同的内存路径。', paragraphs: ['数组有数学上的形状，也有物理上的布局。它们不是同一个概念。行优先矩阵把相邻列放在连续地址中，即使算法选择沿着列访问也是如此。', '缓存实验模拟一个 16 × 16 的行优先矩阵、初始为空的八行直接映射缓存，以及以矩阵元素计量的可调缓存行大小。每次读取都记录地址、行索引、标签和命中状态。', '每行四个元素时，按行访问得到 192 次命中和 64 次未命中；在这些特定假设下，按列访问没有命中。真实处理器还有相联度、预取、多级缓存等影响；这个结果不是其运行时间的预测。', '值得保留的是方法：写明内存模型，检查访问轨迹，并把模型能证明的结论与需要实测的结论分开。'], code: 'block = floor(address / lineSize)\nindex = block mod lineCount\ntag   = floor(block / lineCount)' }
    }
  ]
};
