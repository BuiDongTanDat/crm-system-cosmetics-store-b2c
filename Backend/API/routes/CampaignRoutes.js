const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const CampaignController = require('../Controller/CampaignController');

const router = express.Router();

// router.get('/', CampaignController.getAll);
// router.get('/:id', CampaignController.getById);
router.post('/', CampaignController.create);
// router.put('/:id', CampaignController.update);
// router.delete('/:id', CampaignController.delete);
// router.post('/:id/start', CampaignController.start);
// router.post('/:id/complete', CampaignController.complete);
// router.post('/import', upload.single('file'), CampaignController.importCampaigns);
// router.get('/:id/performance', CampaignController.analyzePerformance);
// router.post('/ai/suggest', CampaignController.aiSuggest);

module.exports = router;
