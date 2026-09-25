const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Proxy middleware for ML service requests.
 * Forwards /api/ml/* → ML_SERVICE_URL/*
 * Gracefully returns 503 if the ML service is unreachable.
 */
const mlProxy = createProxyMiddleware({
  target: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/ml': '' },
  on: {
    proxyReq: (proxyReq, req) => {
      // Pass the authenticated user id to ML service via header
      if (req.user) {
        proxyReq.setHeader('X-NexusAI-User-Id', req.user._id.toString());
        proxyReq.setHeader('X-NexusAI-User-Email', req.user.email);
      }
    },
    error: (err, req, res) => {
      console.error('[ML-PROXY] ML service unreachable:', err.message);
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: 'ML service is currently offline. Please try again later.',
          mlStatus: 'OFFLINE',
        });
      }
    },
  },
});

module.exports = mlProxy;
