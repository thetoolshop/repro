import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  return {
    define: {
      'process.env': JSON.stringify(loadEnv(mode, process.cwd(), '')),
    },
  }
})
