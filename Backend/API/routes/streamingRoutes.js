const express = require('express');
const StreamingController = require('../Controller/StreamingController.js');

const router = express.Router();

// Tạo streamId mới
router.post('/', StreamingController.createStream.bind(StreamingController));

// Prepare YouTube live cho streamId
router.post('/:streamId/youtube', StreamingController.prepareYoutube.bind(StreamingController));

// Upload video
router.post(
  '/:streamId/upload',
  StreamingController.upload,
  StreamingController.uploadVideo.bind(StreamingController)
);

// Start / Pause / Resume / Stop streaming file
router.post('/:streamId/start-file', StreamingController.startStreamFile.bind(StreamingController));
router.post('/:streamId/pause-file', StreamingController.pauseStreamFile.bind(StreamingController));
router.post('/:streamId/resume-file', StreamingController.resumeStreamFile.bind(StreamingController));
router.post('/:streamId/stop-file', StreamingController.stopStreamFile.bind(StreamingController));

module.exports = router;
