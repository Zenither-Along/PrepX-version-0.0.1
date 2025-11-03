// Custom Vite plugin to set proper MIME types for JavaScript modules
export default function mimeTypesPlugin() {
  return {
    name: 'configure-server-mime-types',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Set proper MIME types for JavaScript modules
        if (req.url.endsWith('.js') || req.url.endsWith('.mjs')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
        if (req.url.endsWith('.ts') || req.url.endsWith('.tsx')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
        next();
      });
    }
  };
}