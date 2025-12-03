import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // allowedHosts: true allows everything for the purposes of local developement. This is NOT an acceptable solution for
    // allowedHosts allows everything for the purposes of local developement. This is NOT an acceptable solution for
    // the final production version.
    allowedHosts: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 7000,
    setupFiles: './src/setupTests.js',     
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'src/components/ui/*',
        'src/context/*',
        'src/components/SelectCircumstances.jsx',
        'src/setupTests.js',
        'src/main.jsx',
        'vite.config.js',
        'eslint.config.js'
      ],
    },
  }
})
