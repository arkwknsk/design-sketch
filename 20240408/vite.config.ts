import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    base: "./",
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    plugins: [
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(/<%- title %>/g, env.VITE_APP_TITLE);
        },
      },
    ],
  };
});
