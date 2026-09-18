# INVARIANT

**Deep ideas. Grounded systems.**

A restrained, executable personal homepage. Warm paper, forest-green ink, a mathematical sculpture, and four real computational experiments. No fake terminal, no skill percentages, no pre-recorded compiler trace.

[完整中文说明](./README.zh-CN.md)

## Run

```sh
npm run dev
```

Open `http://127.0.0.1:5173`. Node 20+ is sufficient; Node 22 is used by the included workflow. **No npm install is needed.** The template has no third-party npm dependencies.

Alternatively, the checked-in HTML can be previewed with:

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Do not use `file://` for module/Worker/GPU testing.

## Edit

Public identity, bilingual copy, research-direction cards and complete notes live in `content/site.mjs`. Unknown email, Scholar and CV values are deliberately empty. Work cards are research directions, not invented publication citations.

After a content/template change:

```sh
npm run build
npm test
npm run check
```

`build` regenerates the root HTML and a deployment-only `dist/` directory. CSS/JS changes can be viewed after refreshing; there is no implied hot-reload server.

## Mechanisms

- Native WebGPU/WGSL → WebGL2/GLSL → SVG fallback. The backend label is real. Animation stops off-screen, in hidden tabs, or for reduced motion; rendering is capped at a target of 30 fps.
- A bounded, pure wrapping-i32 language: lexer, parser, AST, SSA-like IR, constant folding, algebraic identities, CSE, DCE, real Wasm binary emission and execution. No `eval`.
- S₃ composition, inverses, a generated multiplication table, and all 216 associativity checks.
- Reproducible direct-mapped cache traces and round-robin scheduler traces. These are teaching models, not hardware benchmarks.
- A lazy module Worker with automatic, explicitly labeled main-thread fallback. A reference interpreter is used if Wasm is unavailable.
- Real links and standalone reading pages, responsive navigation, native dialogs, light/dark modes, EN/中文, and Ctrl/⌘ K.

Fonts are system fonts. No font binaries, analytics scripts, framework payloads, external models or textures are included. There is no Service Worker or cross-origin-isolation requirement.

## Deploy

The root and `dist/` are ordinary static sites. For GitHub Actions, select **Settings → Pages → Source → GitHub Actions** and push to `main`; `.github/workflows/pages.yml` tests, builds, checks, then deploys `dist/`.

For branch deployment, select **main / (root)** and disable the included Pages workflow. Commit rebuilt root HTML when content changes.

This repository publishes to https://hansgutmann-cloud.github.io. The template’s Hantao Zhou identity is retained; edit `content/site.mjs` to update personal content. For a project site, set `site.url` to its full public URL; paths are relative and pages do not need SPA rewrites.

An existing site should be changed on a review branch with its Git history preserved. Do not force-push or blindly replace an existing deployment pipeline.

## Verification boundaries

See [docs/TESTING.md](./docs/TESTING.md). Core and UI checks were run, but the restricted rendering environment had no usable GPU context. The previews show the genuine SVG fallback. Browser UI checks used a local-document fixture, not a live GitHub Pages deployment. A normal-origin, real-GPU and cross-browser smoke test remains necessary before claiming those platforms were verified.

MIT licensed. The implementation is editable; publication claims, personal documents and any third-party assets remain the site owner's responsibility.
