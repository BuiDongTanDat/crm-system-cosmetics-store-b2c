const express = require('express');
const StreamingController = require('../Controller/StreamingController.js');
const permissionRoute = require('../Middleware/permissionMiddleware');

const router = express.Router();

// Tạo streamId mới
router.post('/', permissionRoute('youtube', 'create'), StreamingController.createStream.bind(StreamingController));

// Prepare YouTube live cho streamId
router.post('/:streamId/youtube', permissionRoute('youtube', 'create'), StreamingController.prepareYoutube.bind(StreamingController));

// Upload video
router.post(
  '/:streamId/upload',permissionRoute('youtube', 'create'), 
  StreamingController.upload,
  StreamingController.uploadVideo.bind(StreamingController)
);

// Start / Pause / Resume / Stop streaming file
router.post('/:streamId/start-file', permissionRoute('youtube', 'create'), StreamingController.startStreamFile.bind(StreamingController));
router.post('/:streamId/pause-file', permissionRoute('youtube', 'create'), StreamingController.pauseStreamFile.bind(StreamingController));
router.post('/:streamId/resume-file', permissionRoute('youtube', 'create'), StreamingController.resumeStreamFile.bind(StreamingController));
router.post('/:streamId/stop-file', permissionRoute('youtube', 'create'), StreamingController.stopStreamFile.bind(StreamingController));

module.exports = router;
