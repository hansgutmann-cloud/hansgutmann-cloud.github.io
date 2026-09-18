# INVARIANT — 不变量

一个克制、精密、可执行的个人主页模板。已适配仓库 `hansgutmann-cloud/hansgutmann-cloud.github.io`，保留模板中的 Hantao Zhou 姓名与介绍；所有公开信息集中在 `content/site.mjs`。

**它是完整静态网站，不需要后端、数据库、API Key 或 npm 第三方依赖。** 纯 HTML + CSS + 原生 ES Modules。高级交互是浏览器端的渐进增强，GitHub Pages 只负责静态托管。

## 1. 先运行起来

### 已安装 Node.js（推荐 Node 22 或更新的受支持版本）

解压后，进入包含 `package.json` 的目录：

```bash
cd invariant-homepage
npm run dev
```

不需要运行 `npm install`。打开：

```text
http://127.0.0.1:5173
```

修改 CSS / JS 后刷新浏览器即可。修改 `content/site.mjs` 或 `scripts/render.mjs` 后，重新执行 `npm run build`，再刷新。此开发服务器没有假装实现热更新。

修改端口：

```bash
PORT=3000 npm run dev
# Windows / PowerShell 可直接使用：
node scripts/serve.mjs --port 3000
```

### 只有 Python

包内已经包含生成好的 `index.html` 等页面。直接：

```bash
cd invariant-homepage
python3 -m http.server 5173 --bind 127.0.0.1
```

然后打开上面的本地地址。Python 方案可预览已生成页面；若要重新生成内容页面、sitemap 等，请使用 Node 的构建命令。

**不要通过双击 HTML / `file://` 测试全部功能。** ES Modules、Worker 及现代图形接口需要合适的 Web 来源。本地 `localhost` / `127.0.0.1` 或线上的 HTTPS 是正确的预览方式。

## 2. 设计与页面结构

- 暖纸白、墨绿色、低饱和铜色；细分隔线、衬线标题、系统无衬线正文和等宽技术注释。
- 首屏先说明“是谁、做什么”，右侧是一条连续的 `(2,3)` 环面纽结，不是粒子背景或视频。
- 研究方向卡片、四个可运行实验、三篇完整双语笔记、About 与联系方式。
- 深浅主题、中英切换、命令菜单、手机显式导航、可访问的原生对话框。
- 普通访客不需要输入命令；`Ctrl/⌘ + K` 只是快捷入口，不是强制的终端界面。

没有技能百分比、虚构性能仪表盘、开机倒计时、鼠标劫持、滚动劫持、自动声音和跟随鼠标的夸张拖尾。

## 3. 修改自己的信息

只需先编辑：

```text
content/site.mjs
```

主要字段：

```js
name: 'Hantao Zhou',
initials: 'HZ',
url: 'https://hansgutmann-cloud.github.io',
github: 'https://github.com/hansgutmann-cloud',
email: '',
scholar: '',
cv: '',
defaultLanguage: 'en',
defaultTheme: 'light',
```

邮箱、Scholar 和 CV 没有杜撰：空值时对应入口不显示，联系区默认链接 GitHub。

例如添加简历：

1. 将你自己的公开 PDF 放到 `assets/cv.pdf`。
2. 设置 `cv: './assets/cv.pdf'`。
3. 设置真实邮箱与 Scholar 链接。
4. 执行 `npm run build`。

`en` / `zh` 存放两套正文。`work` 是研究方向列表，`notes` 是文章列表。默认预渲染页面为英文；JavaScript 会按 `defaultLanguage` 和访客保存的偏好切换。禁用脚本时仍可阅读完整英文页面。

**当前三张 work 卡片是研究方向，不是假造的论文、已发表成果或奖项。** 若改成 publication 卡片，请填入已核实的标题、作者、会议、年份和真实链接。详情中的模板说明也应换成你自己的材料。

每个条目可添加外链：

```js
links: [
  { label: 'Paper', url: 'https://example.org/your-real-paper' },
  { label: 'Code', url: 'https://github.com/your-name/your-real-project' }
]
```

`id` 只使用小写英文字母、数字与连字符，且不能重复。修改 `id` 会改变独立页面的 URL；正式发布后不要随意改动已有文章地址。

## 4. 发布到 GitHub Pages

### A. 新建、空白的个人主页仓库

GitHub 仓库名称应为：

```text
hansgutmann-cloud.github.io
```

上传或推送**本目录里面的文件**，让 `index.html` 位于仓库根目录，不要多套一层 `invariant-homepage/`。

对于确实为空的新仓库，可以在模板目录执行：

```bash
git init -b main
git add .
git commit -m "Create INVARIANT personal website"
git remote add origin https://github.com/hansgutmann-cloud/hansgutmann-cloud.github.io.git
git push -u origin main
```

不要对已有历史的主页照抄这段初始化命令。已有主页请用下一节的分支流程。

### B. 你已经有个人主页仓库

保留历史，先做改版分支。确认工作区没有未保存更改：

```bash
git clone https://github.com/hansgutmann-cloud/hansgutmann-cloud.github.io.git
cd hansgutmann-cloud.github.io
git status --short
git switch -c redesign/invariant
```

将解压模板中的文件复制到这个仓库，**保留原来的 `.git/`**。先备份旧站文件；不要使用 `git push --force`，不要执行带 `--delete` 的同步命令。

macOS / Linux 可使用（先替换模板的真实路径）：

```bash
rsync -av \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='node_modules' \
  /absolute/path/to/invariant-homepage/ ./

npm run build
npm test
npm run check
npm run dev
```

确认后提交这个分支并发起 Pull Request：

```bash
git add .
git commit -m "Redesign homepage with INVARIANT"
git push -u origin redesign/invariant
```

如果原仓库有 Next.js / Jekyll / 其他 Pages 发布 workflow，请检查 `.github/workflows/`，**不要保留两个会同时发布同一网站的工作流**。是否删除旧站文件由你检查后决定；本包不执行任何自动删除。

合并到 `main` 前，先完成下面的 Pages 设置。模板的部署工作流仅从 `main` 发布；Pull Request 只测试和构建，不会覆盖线上网站。

### C. 推荐：GitHub Actions 发布

仓库中已经有：

```text
.github/workflows/pages.yml
```

进入 GitHub：

```text
Repository → Settings → Pages
Build and deployment → Source → GitHub Actions
```

推送或合并到 `main` 后，工作流执行：

```text
npm test → npm run build → npm run check → upload dist/ → deploy
```

只部署 `dist/`。不需要部署 Node 服务器，不需要 npm 安装依赖，也不需要你提供个人访问令牌。

如果 Pages 尚未启用，先在 Settings 中选择 GitHub Actions，然后从 Actions 页面手动运行一次工作流。组织仓库还可能需要管理员允许 Pages 或相关 Actions。

### D. 也可以直接从分支发布

模板根目录已有 HTML 与 `.nojekyll`，因此可以选：

```text
Settings → Pages
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

此时请移除或禁用本包的 `.github/workflows/pages.yml`，不要同时使用两套发布方式。后续修改内容时，**在本地运行 `npm run build`，并把生成的根目录 HTML 一起提交**。

### E. 使用项目站点预览，不动现有主站

例如另建仓库 `invariant-preview`，设置：

```js
url: 'https://hansgutmann-cloud.github.io/invariant-preview'
```

然后构建并部署。资源路径采用相对路径，不依赖 SPA history rewrite；项目路径不需要路由服务器。

最终个人主站仍使用 `https://hansgutmann-cloud.github.io`。切换到正式地址后重新构建，更新 canonical、sitemap 与社交预览地址。

## 5. 真正在运行什么

### 图形：WebGPU → WebGL2 → SVG

文件：`assets/js/sculpture.js`、`assets/js/geometry.js`。

优先使用原生 WebGPU + WGSL；无法创建 adapter/device 或管线时尝试 WebGL2 + GLSL；仍不可用时保留 SVG。GPU context 丢失时回退到静态图形。SVG 模式会禁用无意义的旋转和播放按钮。

几何中心线：

```text
c(t) = ((2 + cos 3t) cos 2t,
        (2 + cos 3t) sin 2t,
        sin 3t),  0 ≤ t ≤ 2π
```

沿局部正交标架扫掠窄管，并在参数域中绘制细密表面线条。没有 Three.js，没有模型下载，没有贴图请求。

渲染目标上限 30 帧/秒；限制像素倍率和画布尺寸；离开视口或页面隐藏时停止请求动画帧；尊重 `prefers-reduced-motion`。这些是实现策略，不是未经测量的性能分数。用户显式点击播放可以覆盖自动减少动态效果的初始选择。

检查回退：

```text
http://127.0.0.1:5173/?renderer=webgl2
http://127.0.0.1:5173/?renderer=svg
```

当前使用的后端显示在图形下方。`SVG` 是真实状态，不是“GPU 已开启”的假标识。

### 编译器：表达式 → AST → IR → 优化 → Wasm

文件：`assets/js/core/compiler.js`。

实际实现词法分析、优先级解析、不可变名称绑定、SSA 风格 IR、常量折叠、恒等式化简、公共子表达式消除、死代码消除和 WebAssembly 二进制编码。

语言定义为**无副作用、溢出回绕的有符号 i32 算术**。支持 `+ - *`、括号、一元负号、`let`、`input`、`return` 和 `//` 注释。十进制字面量允许 0…4294967295，按 i32 位模式解释；输入框要求 -2147483648…2147483647。

```js
let a = input * 8;
let b = input * 8;
let unused = 12 * 3;
return a + b + 0;
```

默认 `input=7`，结果是 `112`。当前默认样例从 11 条 IR 指令优化到 4 条，生成的 Wasm 模块为 65 字节。这只是具体样例，不是加速倍数宣称。

生成的模块只导出 `compute(i32) → i32`：没有 import、内存、循环、网络或任意 JS 执行。`↓ .wasm` 可导出实际二进制。每次计算会与同语义的参考解释器比较。

源长度限制 4096 字符、词法 token 限制 512、表达式递归层级限制 48。不使用 `eval` 或 `new Function`。这是限定语言的教学编译器，不是通用远程代码执行环境。

### 代数：S₃

文件：`assets/js/core/algebra.js`。

使用真实置换计算复合和逆元；乘法表不是硬编码。检查 6 个元素、闭包、逆元、生成关系和全部 216 组结合律输入。

约定 `(p ∘ q)(i) = p(q(i))`，最右边的置换先作用。按钮执行右乘：`state ← state ∘ generator`。

### 缓存模型

文件：`assets/js/core/systems.js`。

16 × 16 行优先矩阵、8 行冷启动直接映射缓存。比较按行、按列与 4 × 4 分块访问；提供完整地址/索引/tag/命中轨迹以及拖动回看。

每行 4 个矩阵元素时：按行访问 192 命中、64 未命中；按列访问 0 命中、256 未命中。这里只模拟访存，不把这些结果当成真实处理器的耗时预测。

### 轮转调度

同一 `systems.js` 模块。三项作业 `(arrival, burst)` 分别是 A(0,7)、B(1,4)、C(2,6)。时间片 1…6 可调；新到达任务在当前任务重新入队之前加入队列。

单 CPU、无 I/O、无上下文切换代价。显示真实计算出的时间线、完成时间和等待时间，不伪装成访客电脑的系统监控。

### Worker 与降级

实验按需加载。优先在一个专用 module Worker 中执行；Worker 构造或加载失败时自动转为主线程执行，并明确标记 `MAIN-THREAD FALLBACK`。Wasm 不可用时使用 i32 解释器，界面同样明确标记。

没有使用 SharedArrayBuffer、Wasm 多线程、Service Worker 或自定义服务器响应头；不依赖 cross-origin isolation。因此不需要额外部署 COOP/COEP 配置。

## 6. 代码地图

```text
invariant-homepage/
├── index.html                  # 生成好的主页，可直接发布
├── note-*.html                 # 三篇独立笔记页
├── work-*.html                 # 三个独立研究方向页
├── colophon.html               # 设计、几何与实现说明
├── 404.html
├── content/site.mjs            # 公开内容与配置
├── assets/
│   ├── css/style.css           # 设计 token、布局、响应式、打印样式
│   ├── images/                 # SVG 几何、favicon、PNG 社交预览
│   └── js/
│       ├── app.js              # 语言、主题、导航、对话框、懒加载
│       ├── ui.js               # 中英文 UI 文案
│       ├── sculpture.js        # WebGPU / WebGL2 双后端
│       ├── geometry.js         # 参数化几何
│       ├── lab.js              # 四个实验的界面与线程管理
│       ├── worker.js           # 工作线程协议
│       └── core/
│           ├── compiler.js    # 编译器与 Wasm 生成器
│           ├── algebra.js     # 置换群运算
│           └── systems.js     # 缓存与调度模型
├── scripts/                    # 零依赖构建、预览、静态检查
├── tests/                      # Node 核心与线程协议测试
├── examples/                   # 实际生成的 .expr / .wat / .wasm
├── docs/                       # 设计说明、测试边界、浏览器验收清单
├── .github/workflows/pages.yml
└── dist/                       # npm run build 生成，不需提交
```

## 7. 改颜色与视觉

`assets/css/style.css` 顶部的变量控制全站：

```css
--paper: #f5f3ec;
--ink: #243b32;
--accent: #86603f;
```

暗色主题在 `:root[data-theme="dark"]` 中。高级图形的材质颜色独立写在 GLSL / WGSL shader 中；同时修改这两套着色器以保持一致。

使用设备自带字体。**代码包不包含字体文件、不请求 Google Fonts 或其他字体 CDN。** 中文会按设备字体回退，因此不同操作系统字形略有差异。

修改内容后，社交卡片 `assets/images/social.png` 不会自动跟随姓名变化。它是本次实际页面截图的裁剪；换名后请用自己的页面截图替换，建议尺寸 1200 × 630。

重新生成静态纽结 SVG：

```bash
node scripts/generate-poster.mjs
npm run build
```

## 8. 测试、验收与证据边界

```bash
npm test
npm run build
npm run check
```

测试覆盖编译语义、溢出、512 个生成表达式、S₃、缓存、调度、几何周期性、以及原始 Worker 模块在线程中的消息协议。

另有浏览器检查说明与记录：`docs/TESTING.md`。本包在受限 Chromium 本地文档环境中完成界面检查；该环境无法提供可用 GPU 上下文，也不能代表 Safari、Firefox 或你的真实 GPU。

**不要把这些检查当成已经完成线上部署或跨浏览器 GPU 验收。** 第一次在正常本地 HTTP 来源或 GitHub Pages HTTPS 上打开后，请确认图形脚注、四个实验、手机视图、独立笔记页、主题和命令菜单。

## 9. 安全与隐私

模板不包含分析统计、外部脚本、外部字体或动态 API 请求。用户语言、主题、动画偏好只尝试写入浏览器 localStorage；禁用存储时仍可使用。

这是前端代码，不应该存放密码、API Key、私人手机号、家庭地址或不应公开的简历信息。`content/site.mjs` 和静态资源对访客可读。GitHub Pages 的托管层可能保留自己的访问/安全日志，不能把“模板无统计脚本”理解为“托管服务完全不记录访问”。

构建器按受信任的站点所有者配置生成页面；不要把未审核的任意第三方配置直接喂入构建过程。运行时文章正文用转义后的文本插入；外链只接受 HTTP(S) / mailto。

MIT 许可允许修改和商用。论文图、头像、简历、第三方图片和之后添加的字体，请自行确认使用权。

## 10. 官方资料

- GitHub Pages 静态站点与地址规则：https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Pages 发布源：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- WebGPU：https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- WebGL2：https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext
- Web Workers：https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- WebAssembly：https://developer.mozilla.org/en-US/docs/WebAssembly

本包没有替你登录、修改或部署任何 GitHub 仓库。
