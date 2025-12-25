// backend/src/Interfaces/http/controllers/AutomationFlowController.js
/* eslint-disable camelcase */
const {
  CreateFlowRequestDTO,
  FlowDetailResponseDTO,
  CreateTriggerRequestDTO,
  CreateActionRequestDTO,
  UpdateFlowRequestDTO,
  UpdateTriggerRequestDTO,
  UpdateActionRequestDTO,
  SaveEditorRequestDTO,
  PublishFlowRequestDTO,
  AutomationFlowResponseDTO,
} = require('../../Application/DTOs/AutomationDTO.js');


// const IAutomationActionService = require('../../Application/Interfaces/IAutomationActionService.js');
const AutomationActionService = require('../../Application/Services/AutomationActionService.js');
const AutomationFlowService = require('../../Application/Services/AutomationFlowService.js')

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const AutomationFlowController = {

  create: asyncHandler(async (req, res) => {
    try {
      const dto = CreateFlowRequestDTO.from ? CreateFlowRequestDTO.from(req.body) : req.body;
      const result = await AutomationFlowService.createFlow(dto);
      if (!result.ok) {
        const { status = 500 } = result.error || {};
        return res.status(status).json(result);
      }
      return res.status(201).json(result);
    } catch (e) {
      return res.status(500).json({ ok: false, data: null, error: { status: 500, code: 'INTERNAL_ERROR', message: e.message } });
    }
  }),
  getEditor: asyncHandler(async (req, res) => {
    const data = await AutomationFlowService.getFlowDetail(req.params.flow_id);
    resurt = new AutomationFlowResponseDTO(data);
    return res.json(data);
  }),
  getFlow: asyncHandler(async (req, res) => {
    const data = await AutomationFlowService.getFlowDetail(req.params.flow_id);
    resurt = new AutomationFlowResponseDTO(data);
    return res.json(data);
  }),
  getAllflow: asyncHandler(async (req, res) => {
    const items = await AutomationFlowService.getAllflow(req.query || {});
    return res.json({ items });
  }),
  update: asyncHandler(async (req, res) => {
    const dto = UpdateFlowRequestDTO.from(req.body);
    const updated = await AutomationFlowService.updateFlow(req.params.flow_id, dto);
    return res.json(updated);
  }),

  remove: asyncHandler(async (req, res) => {
    await AutomationFlowService.deleteFlow(req.params.flow_id);
    return res.status(204).send();
  }),

  enable: asyncHandler(async (req, res) => {
    const updated = await AutomationFlowService.setEnabled(req.params.flow_id, true);
    return res.json(updated);
  }),

  disable: asyncHandler(async (req, res) => {
    const updated = await AutomationFlowService.setEnabled(req.params.flow_id, false);
    return res.json(updated);
  }),

  validate: asyncHandler(async (req, res) => {
    const result = await AutomationFlowService.validateFlow(req.params.flow_id);
    return res.json(result);
  }),

  active: asyncHandler(async (req, res) => {
    const result = await AutomationFlowService.setStatusActive(req.params.flow_id);
    return res.json(result);
  }),
  // PUT /api/flows/:flow_id/editor → autosave (upsert triggers/actions), vẫn DRAFT
  saveEditor: asyncHandler(async (req, res) => {
    try {
      const flow_id = req.params.flow_id; // lấy id từ URL
      const dto = SaveEditorRequestDTO.from(req.body);
      dto.flow_id = dto.flow_id || flow_id;
      if (dto.isNewRecord === undefined || dto.isNewRecord === null) {
        dto.isNewRecord = false;
      }
      console.log('>>> saveEditor dto:', dto);
      const result = await AutomationFlowService.saveEditor(flow_id, dto);
      if (!result.ok) {
        const { status = 500 } = result.error || {};
        return res.status(status).json(result);
      }
      return res.status(200).json(result);
    } catch (err) {
      console.error('>>> saveEditor failed:', err);
      return res
        .status(500)
        .json(fail(asAppError(err, { status: 500, code: 'SAVE_EDITOR_FAILED' })));
    }
  }),
  publish: asyncHandler(async (req, res) => {
    const dto = PublishFlowRequestDTO.from(req.body || {});
    const out = await AutomationFlowService.publishFlow(req.params.flow_id, dto);
    return res.json(out);
  }),
  // ===== TRIGGERS =====
  triggers: {
    create: asyncHandler(async (req, res) => {
      const dto = CreateTriggerRequestDTO.from(req.body);
      const payload = service._buildTriggerForSchema({
        flow_id: req.params.flow_id,
        trigger_type: dto.trigger_type,
        trigger_config: dto.trigger_config,
      });
      const trig = await service.triggers.create(payload);
      return res.status(201).json(trig);
    }),

    list: asyncHandler(async (req, res) => {
      const items = await service.triggers.findByFlow(req.params.flow_id);
      return res.json({ items });
    }),

    get: asyncHandler(async (req, res) => {
      const trig = await service.triggers.findById(req.params.trigger_id);
      if (!trig) return res.status(404).json({ message: 'Trigger not found' });
      return res.json(trig);
    }),

    update: asyncHandler(async (req, res) => {
      let patch = UpdateTriggerRequestDTO.from(req.body);
      if (patch.trigger_type) {
        const mapped = service._buildTriggerForSchema({
          flow_id: req.query.flow_id || null,
          trigger_type: patch.trigger_type,
          trigger_config: patch.trigger_config || {},
        });
        patch = {
          event_type: mapped.event_type,
          conditions: mapped.conditions,
          is_active: mapped.is_active,
        };
      }
      const updated = await service.triggers.update(req.params.trigger_id, patch);
      if (!updated) return res.status(404).json({ message: 'Trigger not found' });
      return res.json(updated);
    }),

    remove: asyncHandler(async (req, res) => {
      await service.triggers.delete(req.params.trigger_id);
      return res.status(204).send();
    }),
  },
  actions: {
    create: asyncHandler(async (req, res) => {
      const dto = CreateActionRequestDTO.from(req.body);
      const payload = service._buildActionForSchema({
        flow_id: req.query.flow_id || null,
        action_type: dto.action_type,
        action_config: dto.action_config,
      });
      payload.trigger_id = payload.trigger_id || req.params.trigger_id;
      const act = await service.actions.create(payload);
      return res.status(201).json(act);
    }),

    listByTrigger: asyncHandler(async (req, res) => {
      const items = await service.actions.findByTrigger(req.params.trigger_id);
      return res.json({ items });
    }),

    listByFlow: asyncHandler(async (req, res) => {
      const items = await service.actions.findByFlow(req.params.flow_id);
      return res.json({ items });
    }),

    get: asyncHandler(async (req, res) => {
      const act = await service.actions.findById(req.params.action_id);
      if (!act) return res.status(404).json({ message: 'Action not found' });
      return res.json(act);
    }),
    update: asyncHandler(async (req, res) => {
      const dto = UpdateActionRequestDTO.from(req.body);
      const updated = await service.actions.update(req.params.action_id, dto);
      if (!updated) return res.status(404).json({ message: 'Action not found' });
      return res.json(updated);
    }),

    remove: asyncHandler(async (req, res) => {
      await service.actions.delete(req.params.action_id);
      return res.status(204).send();
    }),

    markSent: asyncHandler(async (req, res) => {
      const updated = await service.markActionSent(req.params.action_id);
      return res.json(updated);
    }),

    markFailed: asyncHandler(async (req, res) => {
      const reason = req.body?.reason || 'unknown_error';
      const updated = await service.markActionFailed(req.params.action_id, reason);
      return res.json(updated);
    }),
  },

  // ===== RUNTIME =====
  runtime: {
    listDueActions: asyncHandler(async (req, res) => {
      const limit = parseInt(req.query.limit, 10) || 500;
      const items = await service.getDuePendingActions(limit);
      return res.json({ items });
    }),

    handleEvent: asyncHandler(async (req, res) => {
      const { event_type, payload } = req.body || {};
      if (!event_type) return res.status(400).json({ message: 'event_type is required' });
      const result = await service.handleEvent(event_type, payload || {});
      return res.json({ result });
    }),
  },
};

module.exports = AutomationFlowController;
