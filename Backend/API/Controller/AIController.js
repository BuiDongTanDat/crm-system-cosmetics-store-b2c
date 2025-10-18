// controllers/AIController.js
const aiClient = require('../../Infrastructure/external/AIClient');
const { ok, fail, asAppError } = require('../../Application/helpers/errors');

class AIController {
  static async healthCheck(req, res) {
    try {
      const result = await aiClient.health();
      return res.status(200).json(ok(result || { message: 'AI Service OK' }));
    } catch (err) {
      console.error('[AI] health check failed:', err.message);
      return res.status(500).json(
        fail(asAppError(err, { status: 500, code: 'AI_HEALTH_FAILED' }))
      );
    }
  }
  
}

module.exports = AIController;
