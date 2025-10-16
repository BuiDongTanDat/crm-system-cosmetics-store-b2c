// backend/src/Domain/Services/LeadService.js
const leadRepository = require('../../Infrastructure/Repositories/LeadRepository');
const aiClient = require('../../Infrastructure/external/AIClient');
const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');

class LeadService {
  constructor() {
    this.repo = leadRepository;
  }

  // --------- CRUD cơ bản ----------
  async createLead(leadData) {
    try {
      if (!leadData) {
        throw new AppError('Lead data is required', { status: 400, code: 'VALIDATION_ERROR' });
      }

      const { customer_id, source, status, lead_score, conversion_prob, assigned_to, tags } = leadData;

      // --- validate cơ bản ---
      if (lead_score !== undefined && isNaN(lead_score)) {
        throw new AppError('lead_score must be a number', { status: 400, code: 'VALIDATION_ERROR' });
      }

      if (conversion_prob !== undefined && (isNaN(conversion_prob) || conversion_prob < 0 || conversion_prob > 1)) {
        throw new AppError('conversion_prob must be between 0 and 1', { status: 400, code: 'VALIDATION_ERROR' });
      }

      // ---- AI scoring ----
      let finalScore = lead_score ?? 0;
      let finalProb = conversion_prob ?? 0.0;
      let score_reason = null;
      let prob_reason = null;

      // Gọi AI để chấm điểm nếu thiếu
      if (lead_score === undefined) {
        try {
          const res = await aiClient.scoreLead(leadData);
          finalScore = Number.isFinite(res.score) ? res.score : 0;
          score_reason = res.reason ?? null;
        } catch (e) {
          console.warn('[AI] scoreLead failed → fallback 0', e?.message || e);
        }
      }
      // Gọi AI để ước lượng xác suất nếu thiếu
      if (conversion_prob === undefined) {
        try {
          const res = await aiClient.estimateConversionProb(leadData);
          finalProb = Number.isFinite(res.probability) ? res.probability : 0.0;
          prob_reason = res.reason ?? null;
        } catch (e) {
          console.warn('[AI] estimateConversionProb failed → fallback 0', e?.message || e);
        }
      }

      const payload = {
        customer_id: customer_id || null,
        source: source || 'website',
        status: status || 'new',
        tags: Array.isArray(tags) ? tags : [],
        lead_score: finalScore,
        conversion_prob: finalProb,
        assigned_to: assigned_to || null,
        created_at: new Date(),
      };

      const lead = await this.repo.create(payload);
      console.log('Created lead:', lead.lead_id, 'Score:', finalScore, 'Prob:', finalProb);
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CREATE_LEAD_FAILED' }));
    }
  }

  async getLeadById(leadId) {
    try {
      const lead = await this.repo.findById(leadId);
      if (!lead) {
        throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      }
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'GET_LEAD_FAILED' }));
    }
  }

  async listLeads(params) {
    try {
      const leads = await this.repo.list(params);
      return ok(leads);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'LIST_LEADS_FAILED' }));
    }
  }

  async updateLead(leadId, patch) {
    try {
      const lead = await this.repo.update(leadId, patch);
      if (!lead) {
        throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      }
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UPDATE_LEAD_FAILED' }));
    }
  }

  async deleteLead(leadId) {
    try {
      const deleted = await this.repo.delete(leadId); // tuỳ repo: boolean | count
      if (!deleted) {
        throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      }
      return ok({ deleted: true });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'DELETE_LEAD_FAILED' }));
    }
  }

  // --------- Tiện ích nghiệp vụ ----------
  // Đổi trạng thái + ghi lịch sử (nếu repo hỗ trợ)
  async changeStatus(leadId, toStatus, reason = null, changedBy = null) {
    try {
      if (!toStatus) {
        throw new AppError('toStatus is required', { status: 400, code: 'VALIDATION_ERROR' });
      }
      const lead = await this.repo.changeStatus?.(leadId, toStatus, { reason, changedBy });
      // fallback nếu repo chưa có changeStatus:
      const result = lead || (await this.repo.update(leadId, { status: toStatus }));
      if (!result) {
        throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      }
      // ghi lịch sử nếu có method:
      if (this.repo.appendStatusHistory) {
        await this.repo.appendStatusHistory(leadId, {
          from_status: result.previousStatus ?? null,
          to_status: toStatus,
          reason,
          changed_by: changedBy,
        });
      }
      return ok(result);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CHANGE_STATUS_FAILED' }));
    }
  }

  // Gán lead cho user
  async assignLead(leadId, userId) {
    try {
      if (!userId) {
        throw new AppError('userId is required', { status: 400, code: 'VALIDATION_ERROR' });
      }
      const lead = await this.repo.assignTo?.(leadId, userId)
        ?? (await this.repo.update(leadId, { assigned_to: userId }));
      if (!lead) {
        throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      }
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'ASSIGN_LEAD_FAILED' }));
    }
  }

  // Bỏ gán
  async unassignLead(leadId) {
    try {
      const lead = await this.repo.assignTo?.(leadId, null)
        ?? (await this.repo.update(leadId, { assigned_to: null }));
      if (!lead) {
        throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      }
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UNASSIGN_LEAD_FAILED' }));
    }
  }

  // Điều chỉnh điểm
  async adjustScore(leadId, delta = 0) {
    try {
      const lead = await this.repo.adjustScore?.(leadId, delta);
      if (!lead) {
        // fallback: tự đọc → cập nhật
        const found = await this.repo.findById(leadId);
        if (!found) {
          throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
        }
        const newScore = (found.lead_score || 0) + Number(delta || 0);
        const updated = await this.repo.update(leadId, { lead_score: newScore });
        return ok(updated);
      }
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'ADJUST_SCORE_FAILED' }));
    }
  }

  // --------- Tagging ----------
  async addTag(leadId, tag) {
    try {
      if (!tag) {
        throw new AppError('Tag is required', { status: 400, code: 'VALIDATION_ERROR' });
      }
      const lead = await this.repo.addTag?.(leadId, tag);
      if (!lead) {
        throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      }
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'ADD_TAG_FAILED' }));
    }
  }

  async removeTag(leadId, tag) {
    try {
      if (!tag) {
        throw new AppError('Tag is required', { status: 400, code: 'VALIDATION_ERROR' });
      }
      const lead = await this.repo.removeTag?.(leadId, tag);
      if (!lead) {
        throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      }
      return ok(lead);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'REMOVE_TAG_FAILED' }));
    }
  }

  async findLeadsByTag(tag) {
    try {
      const leads = await this.repo.findByTag?.(tag);
      return ok(leads ?? []);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'FIND_BY_TAG_FAILED' }));
    }
  }

  // --------- Interaction ----------
  async addInteraction(leadId, interactionData) {
    try {
      const result = await this.repo.addInteraction?.(leadId, interactionData);
      if (!result) {
        throw new AppError('Lead not found or cannot add interaction', {
          status: 404,
          code: 'LEAD_OR_INTERACTION_ERROR',
        });
      }
      return ok(result);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'ADD_INTERACTION_FAILED' }));
    }
  }

  async listInteractions(leadId, params) {
    try {
      const list = await this.repo.listInteractions?.(leadId, params);
      return ok(list ?? []);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'LIST_INTERACTIONS_FAILED' }));
    }
  }

  // --------- Status History ----------
  async listStatusHistory(leadId, params) {
    try {
      const list = await this.repo.listStatusHistory?.(leadId, params);
      return ok(list ?? []);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'LIST_STATUS_HISTORY_FAILED' }));
    }
  }

  async appendStatusHistory(leadId, history) {
    try {
      const item = await this.repo.appendStatusHistory?.(leadId, history);
      if (!item) {
        throw new AppError('Lead not found', { status: 404, code: 'LEAD_NOT_FOUND' });
      }
      return ok(item);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'APPEND_STATUS_HISTORY_FAILED' }));
    }
  }
}

module.exports = new LeadService();
