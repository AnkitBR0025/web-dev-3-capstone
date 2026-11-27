import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// the proxy lets the React app call /api and /socket.io without CORS problems
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5001',
      '/socket.io': { target: 'http://localhost:5001', ws: true },
    },
  },
});
