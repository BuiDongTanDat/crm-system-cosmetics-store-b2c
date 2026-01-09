const express = require('express');
const upload = require('../../Infrastructure/external/UploadCloud');
const CampaignController = require('../Controller/CampaignController');
const CampaignChannelController = require('../Controller/CampaignChannelController');
const CampaignChannelFlowController = require('../Controller/CampaignChannelFlowController');

const router = express.Router();

router.get('/running', CampaignController.getRunning);
router.get('/stats/channels', CampaignController.getChannelStats);
router.get('/by-channel', CampaignController.listByChannel);
router.get('/', CampaignController.getAll);
router.get('/:id', CampaignController.getOne);
router.post('/', upload.single('image'), CampaignController.create);
router.patch('/:id', upload.single('image'), CampaignController.update);
router.get('/:id/metrics', CampaignController.metrics);
router.post('/:id/run', CampaignController.run);
router.post('/:id/submit', CampaignController.submit);
router.post('/:id/reject', CampaignController.reject);
router.post('/:id/approve', CampaignController.approve);
router.patch("/:id/status", CampaignController.updateStatus);
// Channels under campaign
router.post('/:id/channels', CampaignChannelController.create);
router.get('/:id/channels', CampaignChannelController.list);
// Channel resource
router.patch('/channels/:channel_id', CampaignChannelController.update);
router.delete('/channels/:channel_id', CampaignChannelController.remove);
// Channel -> flow mappings
router.post('/channels/:channel_id/flows', CampaignChannelFlowController.add);
router.get('/channels/:channel_id/flows', CampaignChannelFlowController.list);
router.post('/channels/:channel_id/flows/reorder', CampaignChannelFlowController.reorder);
// Mapping resource
router.patch('/channel-flows/:id', CampaignChannelFlowController.update);
router.post('/channel-flows/:id/enable', CampaignChannelFlowController.enable);
router.post('/channel-flows/:id/disable', CampaignChannelFlowController.disable);
router.delete('/channel-flows/:id', CampaignChannelFlowController.remove);
router.get('/stats/channels', CampaignController.getChannelStats);
router.get('/by-channel', CampaignController.listByChannel);
module.exports = router;
