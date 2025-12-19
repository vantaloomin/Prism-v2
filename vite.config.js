import { defineConfig } from 'vite'

export default defineConfig({
    base: '/Prism-v2/',  // GitHub Pages repo name
    root: './',
    server: {
        open: true
    },
    build: {
        outDir: 'dist'
    }
})
