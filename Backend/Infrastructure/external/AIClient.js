const axios = require('axios');
const http = require('http');
const https = require('https');
const { AppError } = require('../../Application/helpers/errors'); 

const DEFAULTS = {
  BASE_URLS: [
    process.env.AI_SERVICE_URL,
    'http://crm_ai_service:8000',
    'http://crm_ai_servic:8000',
    'http://localhost:8000',
  ].filter(Boolean),
  TIMEOUT_MS: Number(process.env.AI_TIMEOUT_MS || 10000),
  RETRIES: Number(process.env.AI_RETRIES || 3),
};

class AIClient {
  constructor(options = {}) {
    const baseURL = options.baseURL || DEFAULTS.BASE_URLS[0];
    if (!baseURL) throw new Error('AIClient: baseURL is required');

    this.baseURL = baseURL;
    this.timeout = options.timeout || DEFAULTS.TIMEOUT_MS;
    this.retries = options.retries ?? DEFAULTS.RETRIES;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: { 'Content-Type': 'application/json' },
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50 }),
      validateStatus: () => true,
    });
  }

  async _request(method, path, { data, params, headers } = {}) {
    let attempt = 0;
    let lastErr;

    while (attempt <= this.retries) {
      try {
        const res = await this.client.request({ method, url: path, data, params, headers });
        if (res.status >= 200 && res.status < 300) return res.data;
        throw new AppError(`AI service error: ${res.status}`, {
          status: res.status,
          code: 'AI_SERVICE_ERROR',
          details: res.data,
        });
      } catch (err) {
        lastErr = err;
        const isNetwork = !!err.code && ['ECONNABORTED','ECONNRESET','ENOTFOUND','EAI_AGAIN','ETIMEDOUT'].includes(err.code);
        const status = err?.response?.status;
        const isRetryable = isNetwork || [408,429,500,502,503,504].includes(status);
        if (!isRetryable || attempt === this.retries) break;
        const delay = Math.min(2000, 200 * Math.pow(2, attempt));
        await new Promise(r => setTimeout(r, delay));
        attempt += 1;
      }
    }

    if (lastErr instanceof AppError) throw lastErr;
    const status = lastErr?.response?.status ?? 500;
    const details = lastErr?.response?.data || lastErr?.message || lastErr;
    throw new AppError('AI service request failed', { status, code: 'AI_SERVICE_REQUEST_FAILED', details });
  }

  // ---- Endpoints ----
  async health() {
    return this._request('GET', '/health');
  }

  async scoreLead(leadData, opts = {}) {
    const data = await this._request('POST', '/v1/leads/score', { data: { lead: leadData, options: opts } });
    return { score: Number(data?.score ?? 0), reason: data?.reason || null, raw: data };
  }

  async estimateConversionProb(leadData, opts = {}) {
    const data = await this._request('POST', '/v1/leads/conversion_prob', { data: { lead: leadData, options: opts } });
    return { probability: Number(data?.probability ?? 0), reason: data?.reason || null, raw: data };
  }
  async predictConversion(features) {
    const { data } = await axios.post(`${BASE_URL}/predict`, features);
    return data;
  }

  async predictBatch(batchFeatures) {
    const { data } = await axios.post(`${BASE_URL}/predict/batch`, { leads: batchFeatures });
    return data; // { results: [ {lead_id, probability, reason}, ... ] }
  }
  async summarize(text, opts = {}) {
    return this._request('POST', '/v1/text/summarize', { data: { text, options: opts } });
  }

  async classifyIntent(text, labels = [], opts = {}) {
    return this._request('POST', '/v1/text/classify', { data: { text, labels, options: opts } });
  }

  async extractEntities(text, schema = {}, opts = {}) {
    return this._request('POST', '/v1/text/extract', { data: { text, schema, options: opts } });
  }

  async generateEmail(input, opts = {}) {
    return this._request('POST', '/v1/generation/email', { data: { input, options: opts } });
  }
}

// ✅ Export instance (singleton)
const instance = new AIClient({ baseURL: process.env.AI_SERVICE_URL });
module.exports = instance;
