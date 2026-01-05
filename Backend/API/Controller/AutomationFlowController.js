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
  ActionResponseDTO,
  TriggerResponseDTO,
} = require('../../Application/DTOs/AutomationDTO.js');
const { AppError, ok, fail, asAppError } = require('../../Application/helpers/errors.js');


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
      // Wrap the created flow in DTO
      if (result.data?.flow) {
        result.data.flow = new AutomationFlowResponseDTO(result.data.flow);
      }
      return res.status(201).json(result);
    } catch (e) {
      return res.status(500).json(fail(asAppError(e)));
    }
  }),
  getEditor: asyncHandler(async (req, res) => {
    const result = await AutomationFlowService.getFlowDetail(req.params.flow_id);
    if (result.ok) {
      result.data = new FlowDetailResponseDTO(result.data);
    }
    return res.json(result);
  }),
  getFlow: asyncHandler(async (req, res) => {
    const result = await AutomationFlowService.getFlowDetail(req.params.flow_id);
    if (result.ok) {
      result.data = new FlowDetailResponseDTO(result.data);
    }
    return res.json(result);
  }),
  getAllflow: asyncHandler(async (req, res) => {
    const result = await AutomationFlowService.getAllflow(req.query || {});
    // result is already ok({ items: details }) which is { ok: true, data: { items: [...] } }
    return res.json(result);
  }),
  update: asyncHandler(async (req, res) => {
    const dto = UpdateFlowRequestDTO.from(req.body);
    const updated = await AutomationFlowService.updateFlow(req.params.flow_id, dto);
    // updateFlow hiện trả về raw instance hoặc AppError
    if (updated instanceof Error) throw updated;
    return res.json(ok({ flow: new AutomationFlowResponseDTO(updated) }));
  }),

  remove: asyncHandler(async (req, res) => {
    await AutomationFlowService.deleteFlow(req.params.flow_id);
    return res.status(204).send();
  }),

  enable: asyncHandler(async (req, res) => {
    const result = await AutomationFlowService.setEnabled(req.params.flow_id, true);
    if (result.ok && result.data?.flow) {
      result.data.flow = new AutomationFlowResponseDTO(result.data.flow);
    }
    return res.json(result);
  }),

  disable: asyncHandler(async (req, res) => {
    const result = await AutomationFlowService.setEnabled(req.params.flow_id, false);
    if (result.ok && result.data?.flow) {
      result.data.flow = new AutomationFlowResponseDTO(result.data.flow);
    }
    return res.json(result);
  }),

  validate: asyncHandler(async (req, res) => {
    const result = await AutomationFlowService.validateFlow(req.params.flow_id);
    return res.json(result);
  }),

  active: asyncHandler(async (req, res) => {
    const result = await AutomationFlowService.setStatusActive(req.params.flow_id);
    if (result.ok && result.data?.flow) {
      result.data.flow = new AutomationFlowResponseDTO(result.data.flow);
    }
    return res.json(result);
  }),
  // PUT /api/flows/:flow_id/editor → autosave (upsert triggers/actions), vẫn DRAFT
  saveEditor: asyncHandler(async (req, res) => {
    try {
      const flow_id = req.params.flow_id; // lấy id từ URL
      const dto = SaveEditorRequestDTO.from(req.body);
      dto.flow_id = dto.flow_id || flow_id;
      console.log('>>> saveEditor dto:', dto);
      const result = await AutomationFlowService.saveEditor(flow_id, dto);
      if (!result.ok) {
        const { status = 500 } = result.error || {};
        return res.status(status).json(result);
      }

      // Wrap result in DTO to maintain consistency
      if (result.data?.flow) {
        const { flow, triggers, actions, updated } = result.data;
        result.data = {
          ...new FlowDetailResponseDTO({ flow, triggers, actions }),
          updated,
        };
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
    if (out.ok && out.data?.flow) {
      out.data.flow = new AutomationFlowResponseDTO(out.data.flow);
    }
    return res.json(out);
  }),
  // ===== TRIGGERS =====
  triggers: {
    create: asyncHandler(async (req, res) => {
      const dto = CreateTriggerRequestDTO.from(req.body);
      // Gán flow_id từ params
      const payload = {
        flow_id: req.params.flow_id,
        event_type: dto.event_type || dto.trigger_type,
        conditions: dto.conditions || dto.trigger_config || {},
        is_active: dto.is_active !== false
      };
      const trig = await AutomationFlowService.triggers.create(payload);
      return res.status(201).json(ok(new TriggerResponseDTO(trig)));
    }),

    list: asyncHandler(async (req, res) => {
      const items = await AutomationFlowService.triggers.findByFlow(req.params.flow_id);
      return res.json(ok({ items: (items || []).map(t => new TriggerResponseDTO(t)) }));
    }),

    get: asyncHandler(async (req, res) => {
      const trig = await AutomationFlowService.triggers.findById(req.params.trigger_id);
      if (!trig) return res.status(404).json(fail(new AppError('Trigger not found', { status: 404 })));
      return res.json(ok(new TriggerResponseDTO(trig)));
    }),

    update: asyncHandler(async (req, res) => {
      const patch = UpdateTriggerRequestDTO.from(req.body);
      const updated = await AutomationFlowService.triggers.update(req.params.trigger_id, patch);
      if (!updated) return res.status(404).json(fail(new AppError('Trigger not found', { status: 404 })));
      return res.json(ok(new TriggerResponseDTO(updated)));
    }),

    remove: asyncHandler(async (req, res) => {
      await AutomationFlowService.triggers.delete(req.params.trigger_id);
      return res.status(204).send();
    }),
  },
  actions: {
    create: asyncHandler(async (req, res) => {
      const dto = CreateActionRequestDTO.from(req.body);
      const payload = {
        flow_id: req.params.flow_id || req.query.flow_id,
        trigger_id: req.params.trigger_id,
        action_type: dto.action_type,
        content: dto.action_config || {},
      };
      const act = await AutomationFlowService.actions.create(payload);
      return res.status(201).json(ok(new ActionResponseDTO(act)));
    }),

    listByTrigger: asyncHandler(async (req, res) => {
      const items = await AutomationFlowService.actions.findByTrigger(req.params.trigger_id);
      return res.json(ok({ items: (items || []).map(a => new ActionResponseDTO(a)) }));
    }),

    listByFlow: asyncHandler(async (req, res) => {
      const items = await AutomationFlowService.actions.findByFlow(req.params.flow_id);
      return res.json(ok({ items: (items || []).map(a => new ActionResponseDTO(a)) }));
    }),

    get: asyncHandler(async (req, res) => {
      const act = await AutomationFlowService.actions.findById(req.params.action_id);
      if (!act) return res.status(404).json(fail(new AppError('Action not found', { status: 404 })));
      return res.json(ok(new ActionResponseDTO(act)));
    }),
    update: asyncHandler(async (req, res) => {
      const dto = UpdateActionRequestDTO.from(req.body);
      const updated = await AutomationFlowService.actions.update(req.params.action_id, dto);
      if (!updated) return res.status(404).json(fail(new AppError('Action not found', { status: 404 })));
      return res.json(ok(new ActionResponseDTO(updated)));
    }),

    remove: asyncHandler(async (req, res) => {
      await AutomationFlowService.actions.delete(req.params.action_id);
      return res.status(204).send();
    }),

    markSent: asyncHandler(async (req, res) => {
      const updated = await AutomationFlowService.actions.markSent(req.params.action_id);
      return res.json(updated);
    }),

    markFailed: asyncHandler(async (req, res) => {
      const reason = req.body?.reason || 'unknown_error';
      const updated = await AutomationFlowService.actions.markFailed(req.params.action_id, reason);
      return res.json(updated);
    }),
  },

  // ===== RUNTIME =====
  runtime: {
    listDueActions: asyncHandler(async (req, res) => {
      const items = await AutomationActionService.pickDueActions();
      return res.json({ items });
    }),

    handleEvent: asyncHandler(async (req, res) => {
      const { event_type, payload } = req.body || {};
      if (!event_type) return res.status(400).json({ message: 'event_type is required' });
      await AutomationService.trigger(event_type, payload || {});
      return res.json({ ok: true });
    }),
  },
};

module.exports = AutomationFlowController;
