import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // <-- Swapped 'react' and 'plugin' here
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})