import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on current mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Set in process.env so our local API handler can access them
  process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  return {
    server: {
      port: 5173,
      strictPort: false,
      hmr: {
        protocol: 'ws',
        host: 'localhost'
      }
    },
    build: {
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-catalog-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url.split('?')[0];
            if (url === '/api/catalog' || url === '/api/catalog.xml') {
              console.log(`[Dev Server] Intercepting XML Feed request at: ${url}`);
              try {
                // Dynamically import the api handler
                const { default: handler } = await import('./api/catalog.js');
                
                // Mock Vercel response helper methods since Connect/Vite res object
                // doesn't have .status(), .json(), or .send() by default.
                res.status = (statusCode) => {
                  res.statusCode = statusCode;
                  return res;
                };
                res.json = (data) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                  return res;
                };
                res.send = (data) => {
                  res.end(data);
                  return res;
                };

                await handler(req, res);
              } catch (err) {
                console.error('[Dev Server] Error executing handler:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: `Local API error: ${err.message}` }));
              }
            } else {
              next();
            }
          });
        }
      }
    ],
  };
})
