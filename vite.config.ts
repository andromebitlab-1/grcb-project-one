import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api-reddit': {
        target: 'https://www.reddit.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-reddit/, ''),
      },
      '/api-4chan': {
        target: 'https://a.4cdn.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-4chan/, ''),
      },
      '/api-translate': {
        target: 'https://translate.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-translate/, '/translate_a/single?client=gtx&sl=auto&tl=es&dt=t'),
      }
    }
  }
});
