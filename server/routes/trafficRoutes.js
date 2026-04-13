const express = require('express');
const router = express.Router();
const trafficController = require('../controllers/trafficController');

router.get('/stats', trafficController.getStats);
router.get('/alerts', trafficController.getAlerts);
router.get('/trends', trafficController.getTrends);
router.post('/ingest', trafficController.ingestData);

module.exports = router;
