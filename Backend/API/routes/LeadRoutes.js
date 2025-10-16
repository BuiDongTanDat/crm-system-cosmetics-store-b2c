const express = require('express');
const router = express.Router();
const LeadController = require('../Controller/LeadController');
// const multer = require('multer');
// const upload = multer({ dest: 'uploads/' });

// router.post('/import', upload.single('file'), LeadController.importLeads);
router.post('/', LeadController.create);
router.get('/', LeadController.getAll);
router.get('/:id', LeadController.getById);
router.put('/:id', LeadController.update);
router.delete('/:id', LeadController.delete);
router.post('/:id/assign', LeadController.assignLead);
router.post('/:id/status', LeadController.changeStatus);

// AI endpoints
router.get('/:id/analyze-score', LeadController.analyzeLeadScore);
router.get('/:id/auto-classify', LeadController.autoClassifyLead);
router.post('/auto-distribute', LeadController.autoDistributeLeads);
router.post('/:id/convert', LeadController.convertLeadToCustomer);

module.exports = router;
