# Verification report / 验证记录

This report distinguishes executed tests from unverified deployment paths. It does not claim a Lighthouse score, a performance speedup, or universal browser compatibility.

## Executed verification

### Core tests — 10 passing groups

Environment: Node.js 22.16.0. Reproduce with:

```bash
npm test
```

The tests verify:

1. The sample expression compiles and returns `112` for input `7`.
2. Signed wrapping i32 semantics, overflow, negative inputs, identities and common-subexpression elimination.
3. **512 generated expressions**, comparing the original IR interpreter, optimized IR interpreter and the emitted, executed WebAssembly module.
4. Rejection of malformed programs, unsupported instructions, unbound names and oversized input.
5. S₃ closure, inverses, all 216 associativity triples and noncommutativity.
6. Matrix-address generation and cache statistics: default row traversal gives 192 hits / 64 misses; column traversal gives 0 hits / 256 misses.
7. Round-robin scheduling conserves execution demand and obeys arrivals across quantum values 1–10.
8. Scheduler input validation and idle periods.
9. Finite mesh coordinates, unit normals and periodic curve/frame consistency.
10. The original browser Worker module executes all four models and returns errors through its message protocol, using a Node `worker_threads` adapter.

These are test groups, not ten individual input cases. The worker adapter imports the original module; it is not a replacement implementation of its algorithms.

### UI verification — 29 passing checks

Executed with Playwright and the available Chromium binary. The machine-readable result is `ui-results.json` in this directory.

Coverage includes actual in-browser Wasm computation, editable expressions, generated WAT, invalid input handling, group operations, cache statistics, scheduler changes, command-menu keyboard navigation, tab keyboard navigation, native dialog open/close, English/Chinese switching, light/dark switching, standalone articles, no-JavaScript reading, reduced-motion scrolling and no horizontal page overflow at 360 / 390 / 768 / 1024 CSS-pixel viewport widths.

**Important environment limitations:**

- The managed browser blocks URL navigation. UI checks therefore loaded real generated document content using `set_content`, with local assets supplied through a resource route. They were not an end-to-end navigation test of a deployed website.
- This environment could not create either a WebGPU or a WebGL context. The delivered screenshots show the genuine SVG fallback, not a GPU render. The WGSL/GLSL rendering paths require visual verification on a GPU-capable browser.
- The opaque-origin browser document could not import the dedicated Worker. The automatic, explicitly labeled main-thread fallback executed real WebAssembly. Off-thread behavior was separately tested through the Node Worker adapter; normal-origin browser Worker startup is still a deployment smoke-test item.
- Safari and Firefox were not executed in this environment. No actual GitHub repository or Pages deployment was modified or tested.

### Build, static and HTTP checks

`npm run build` generated nine HTML pages. `npm run check` passed syntax checks for 19 JavaScript modules, local asset/link existence and duplicate HTML IDs. Ten local HTTP requests returned 200, including JavaScript modules, CSS, a standalone article, the social image and a 65-byte Wasm file with the correct MIME type and binary magic. See `http-checks.json`. These HTTP checks are independent of the restricted browser navigation fixture.

## Run the optional normal-origin browser smoke test

This optional test has no effect on runtime dependencies. It requires Python and Playwright in your local test environment:

```bash
python3 -m pip install playwright
python3 -m playwright install chromium
npm run dev
# In another terminal:
python3 tests/browser_smoke.py
```

Override the origin with `INVARIANT_URL` and the browser executable with `CHROMIUM_PATH` when appropriate. The default address is `http://127.0.0.1:5173`. This normal-navigation script is supplied for reproduction; it was not run in the restricted delivery environment.

## Deployment acceptance checklist

1. Load the site from localhost or HTTPS, not by double-clicking an HTML file. Check the browser console for unexpected errors and verify CSS, modules, SVG and Wasm asset requests return 200.
2. On a GPU-capable browser, confirm the hero reports WebGPU or WebGL2, displays the mesh correctly and supports drag / rotate / pause. Compare light and dark themes. Test `?renderer=webgl2` and `?renderer=svg` explicitly.
3. Enter the Playground. On an ordinary supported origin the status should identify a Worker. An environment that blocks Workers should instead show the explicit main-thread fallback, not a broken panel.
4. Compile the default program: input `7` must return `112`. Change the program and input, inspect optimized IR and WAT, and download the actual Wasm binary.
5. Change all four experiments. Test invalid compiler input and confirm the rest of the page remains usable.
6. Navigate by keyboard only: skip link, section links, theme/language buttons, command menu, tab arrows, form fields, article dialog, Escape and focus restoration.
7. Enable reduced motion. The GPU object must not auto-rotate; the site must not force smooth scrolling. The supplied preview environment verified CSS scrolling, not the unavailable GPU animation loop.
8. Test a small phone and desktop; test your preferred browser and one additional browser. Zoom text to 200% and inspect labels and controls.
9. Disable JavaScript: descriptions and standalone notes must remain readable. The interactive experiments are intentionally JavaScript-dependent.
10. Before publishing, replace all public profile fields, verify every external link, review your CV for private information, and confirm only one Pages workflow is allowed to deploy.

## Interpretation boundaries

The compiler is a small, explicitly bounded expression-language compiler, not a general C/Rust/JavaScript compiler. The cache and scheduler are teaching models, not measurements of the visitor's CPU or operating system. The group model implements S₃, not an unbounded computer algebra system. Source comments and `SEMANTICS.md` specify the assumptions.

测试已通过不等于所有浏览器、GPU 和线上环境均已验收。尚未执行的路径如上明确列出；没有用降级截图冒充 WebGPU 实测效果。
