const express = require('express');
const router = express.Router();
const LeadController = require('../Controller/LeadController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/import', upload.single('file'), LeadController.importLeads);
// CRUD
router.post('/', LeadController.create);
router.get('/', LeadController.getAll);
router.get('/:id', LeadController.getById);
router.get('/detail/:id', LeadController.getLeadDetails);
router.patch('/:id', LeadController.update);
// router.delete('/:id', LeadController.delete);
// Status & History
router.patch('/:id/status', LeadController.changeStatus);
router.get('/:id/status-history', LeadController.listStatusHistory);

// Interactions
router.post('/:id/interactions', LeadController.addInteraction);
router.get('/:id/interactions', LeadController.listInteractions);
router.get('/pipeline/summary', LeadController.getPipelineSummary);
router.get('/pipeline/columns', LeadController.getPipelineColumns);
router.patch('/pipeline/:leadId/status', LeadController.updateLeadStatus);
// // Assign / Flow
// router.post('/:id/assign', LeadController.assign);
// router.post('/:id/unassign', LeadController.unassign);
// router.post('/:id/flow', LeadController.updateFlow);

// Conversion
router.post('/:id/convert', LeadController.convert);
router.post('/:id/auto-convert', LeadController.autoConvert);

// Scoring
// router.post('/:id/score/adjust', LeadController.adjustScore);

// Prediction
router.get('/:id/predict', LeadController.predict);
router.get('/predict/batch', LeadController.predictBatch);

module.exports = router;
