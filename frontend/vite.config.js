import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext', // Ensure a modern ECMAScript target for import.meta.env
  },
  // Optionally, for local network access during development:
  // server: {
  //   host: true, // Allows access from local network IPs
  //   port: 5173, // Default Vite port
  // }
});
