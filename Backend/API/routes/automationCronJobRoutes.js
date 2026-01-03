// backend/src/Presentation/Routes/automationCronJobRoutes.js
const express = require('express');
const controller = require('../Controller/AutomationCronJobController');

const router = express.Router();

// GET all
router.get('/automation/cron-jobs', (req, res) => controller.list(req, res));

// GET by job_key
router.get('/automation/cron-jobs/:job_key', (req, res) => controller.get(req, res));

// PUT upsert (body must include job_key)
router.put('/automation/cron-jobs', (req, res) => controller.upsert(req, res));

// PATCH update by job_key
router.patch('/automation/cron-jobs/:job_key', (req, res) => controller.update(req, res));

// DELETE
router.delete('/automation/cron-jobs/:job_key', (req, res) => controller.remove(req, res));

module.exports = router;
