import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // ============================================
  // BUILD OPTIMIZATIONS
  // ============================================
  build: {
    // Enable source maps for debugging (disable in production if not needed)
    sourcemap: false,

    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info'], // Remove specific functions
      },
      mangle: true,
      format: {
        comments: false, // Remove comments
      },
    },

    // Code splitting configuration
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks - these change rarely, so they cache well
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-icons': ['lucide-react'],
        },

        // Optimize chunk file names for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId || '';

          // Admin chunks
          if (facadeModuleId.includes('/admin/')) {
            return 'assets/admin/[name]-[hash].js';
          }

          // Account chunks
          if (facadeModuleId.includes('/account/')) {
            return 'assets/account/[name]-[hash].js';
          }

          return 'assets/[name]-[hash].js';
        },

        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').pop() || '';

          // Organize assets by type
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          if (extType === 'css') {
            return 'assets/css/[name]-[hash][extname]';
          }

          return 'assets/[name]-[hash][extname]';
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 500, // KB

    // Target modern browsers for smaller bundles
    target: 'es2020',
  },

  // ============================================
  // DEVELOPMENT OPTIMIZATIONS
  // ============================================
  server: {
    // Enable HMR
    hmr: true,

    // Open browser automatically
    open: false,

    // Port configuration
    port: 5173,
    strictPort: false,
  },

  // ============================================
  // PREVIEW (Production simulation)
  // ============================================
  preview: {
    port: 4173,
  },

  // ============================================
  // DEPENDENCY OPTIMIZATION
  // ============================================
  optimizeDeps: {
    // Pre-bundle these dependencies for faster dev startup
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
    ],

    // Exclude if causing issues
    exclude: [],
  },

  // ============================================
  // RESOLVE CONFIGURATION
  // ============================================
  resolve: {
    alias: {
      // Add aliases for cleaner imports (optional)
      // '@': '/src',
      // '@components': '/src/components',
      // '@pages': '/src/pages',
      // '@lib': '/src/lib',
    },
  },

  // ============================================
  // ENVIRONMENT VARIABLES
  // ============================================
  envPrefix: 'VITE_', // Only expose VITE_ prefixed env vars
})
