import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
const gateway = (env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080').replace(/\/$/, '');  const proxySettings = { target: gateway, changeOrigin: true };
  // Proxy REST, OAuth, and WebSocket endpoints
  const proxy = Object.fromEntries([
    ['/api', proxySettings],
    ['/oauth2', proxySettings],
    ['^/login/oauth2/code/.*', proxySettings],
    ['/ws', { ...proxySettings, ws: true }],
  ]);
  return { plugins: [react()], server: { proxy } };
});
