import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      hmr: {
        clientPort: env.HMR_PORT ? parseInt(env.HMR_PORT) : 5174,
      },
      // Nếu chỉ muốn mock FE, hãy comment toàn bộ block proxy này lại như trên
      proxy: {
        '^/(api|automation)(/|$)': {
          target: 'http://backend:5000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 5173,
    },
  }
})