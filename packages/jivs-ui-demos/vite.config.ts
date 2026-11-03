import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Multi-page site: one HTML entry per technology (dom now; react and angular later).
export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                dom: resolve(__dirname, 'dom/index.html'),
                domPlayground: resolve(__dirname, 'dom/playground/index.html')
            }
        }
    },
    server: {
        // Workspace packages (including jivs-dom/assets/jivs-dom.css) are symlinked from outside this folder.
        fs: { allow: [resolve(__dirname, '../..')] },
        proxy: {
            '/api': 'http://localhost:3000'   // the Node demo server, added later
        }
    }
});
