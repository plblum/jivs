# jivs-ui-demos

Demo and playground website for the Jivs UI packages (`jivs-dom`, `jivs-dom-tippy`, later React and Angular).
It supports exploration, documentation-by-example and promotion. It is **not** the product documentation.

## Running

From the repo root, once:

```
npm install
npm run compile
```

Then from `packages/jivs-ui-demos`:

```
npm run dev       # Vite dev server, hot reload
npm run build     # production build into dist/
npm run preview   # serve dist/
npx tsc --noEmit -p .   # type check
```

Packages are consumed through `@plblum/jivs-*/build/...`, so rebuild the other packages (`npm run compile`) after changing them.

## Debugging in VS Code

Open the repo root (`jivs`) in VS Code, then use **Run and Debug** and pick **jivs-ui-demos: Playground (Edge)** or **(Chrome)**, and press F5.
This starts the Vite dev server through the task `jivs-ui-demos: dev server` (port 5173, `--strictPort`) and opens a debuggable browser on `/dom/playground/`.
Stopping the debug session leaves the server task running in its own terminal panel; stop it there (Ctrl+C or kill the terminal).

- Breakpoints work in this site's `.ts` files and, through source maps, in the real `jivs-engine`, `jivs-builder`, `jivs-dom` and `jivs-dom-tippy` sources under `packages/*/src`.
- That requires those packages to have been compiled (`npm run compile` at the root), because the site runs their `build/` output. Recompile after editing their sources, then refresh.
- If breakpoints show as unbound, open DevTools, confirm the file appears under `localhost:5173/@fs/...`, and check that port 5173 is free (a stale Vite on another port gives a URL mismatch).
- Alternative without launching: run `npm run dev`, open the page in Edge or Chrome, and use the browser's DevTools Sources panel. Source maps work there too.

## Layout

| Path | Purpose |
|---|---|
| `index.html` | Landing page |
| `dom/` | jivs-dom pages (future: `react/`, `angular/`) |
| `dom/playground/` | Live-engine playground of error message presentations, state, messages and editors |
| `src/jivs-setup/` | Copies of `create_JivsServices.ts` and `configureJivsDom.ts`, edited for this site |
| `src/demo.css` | Site chrome only. Never restyle jivs-dom here |
| `vite.config.ts` | Multi-page inputs. Add a page by adding an entry |

## Key decisions

See [planning.md](./planning.md) for details. In brief:

- `jivs-dom.css` is imported from `@plblum/jivs-dom/assets/jivs-dom.css` via the workspace link. It is the single source of truth. Edit it in `packages/jivs-dom/assets` and refresh.
- `src/jivs-setup/*` are manual copies of the starter code. Changes to the originals are applied by hand.
- Popups use `@plblum/jivs-dom-tippy`.
- Vite is pinned to 6.x because Vite 8 fails on Node 22.1.0.
