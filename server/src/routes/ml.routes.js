const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const mlProxy = require('../middleware/mlProxy');

/**
 * All ML routes are protected — the user must be authenticated.
 * The proxy then forwards the request to the Python ML service.
 *
 * Available ML endpoints (served by ml-services/):
 *   POST /api/ml/analyze-pose   — skeletal pose analysis
 *   POST /api/ml/scan-food      — food image scanning
 *   GET  /api/ml/health         — ML service health check
 *
 * To add more ML endpoints, simply add them to the ml-services/ FastAPI
 * server — they will be auto-proxied here without any changes needed.
 */
router.use(protect, mlProxy);

module.exports = router;
