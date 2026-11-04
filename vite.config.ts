import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // O Recharts (seção de gráficos) é carregado sob demanda, em um chunk separado.
    chunkSizeWarningLimit: 600,
  },
});
