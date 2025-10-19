// backend/src/Infrastructure/repositories/AutomationFlowRepository.js
const { Op } = require('sequelize');
// const IAutomationFlowRepository = require('../../Domain/Interfaces/IAutomationFlowRepository');
const AutomationFlow = require('../../Domain/Entities/AutomationFlow');
// const AutomationTrigger = require('../../Domain/Entities/AutomationTrigger');
// const AutomationAction = require('../../Domain/Entities/AutomationAction');
const AutomationTriggerRepository = require('./AutomationTriggerRepository');
const AutomationActionRepository = require('./AutomationActionRepository');

class AutomationFlowRepository {
  async create(data) {
    console.log(data);
    return await AutomationFlow.create(data);
  }

  async findById(flow_id) {
    return await AutomationFlow.findByPk(flow_id);
  }

  async findAll({ enabled, q, limit = 100, offset = 0 } = {}) {
    const where = {};
    if (enabled !== undefined) where.enabled = !!enabled;
    if (q) where.name = { [Op.iLike]: `%${q}%` };
    return await AutomationFlow.findAll({ where, limit, offset, order: [['updated_at', 'DESC']] });
  }

  async update(flow_id, patch) {
    const inst = await AutomationFlow.findByPk(flow_id);
    if (!inst) return null;
    patch.updated_at = new Date();
    await inst.update(patch);
    return inst;
  }

  async delete(flow_id) {
    await AutomationFlow.destroy({ where: { flow_id } });
  }

  async toggle(flow_id, enabled) {
    const inst = await AutomationFlow.findByPk(flow_id);
    if (!inst) return null;
    await inst.update({ enabled, updated_at: new Date() });
    return inst;
  }

  // ✅ Trả về mảng item: { flow_id, name, description, is_active, trigger, actions[] }
  async findByEvent(eventType) {
    // 1) Lấy các trigger theo event đang active từ repo Trigger
    const triggers = await AutomationTriggerRepository.list({
      event_type: eventType,
      is_active: true,
      limit: 1000,
      offset: 0,
    });

    if (!triggers || triggers.length === 0) return [];

    // 2) Lấy meta Flow cho các flow_id liên quan (vì Trigger repo không hỗ trợ include)
    const flowIds = [...new Set(triggers.map(t => t.flow_id))];
    const flows = await AutomationFlow.findAll({
      where: { flow_id: { [Op.in]: flowIds } },
    });
    const flowById = new Map(flows.map(f => [f.flow_id, f]));

    // 3) Lấy actions theo từng flow qua repo Action (repo chỉ hỗ trợ findByFlow)
    const actionsByFlowEntries = await Promise.all(
      flowIds.map(async (fid) => {
        const acts = await AutomationActionRepository.findByFlow(fid);
        // Lọc active nếu schema có is_active; nếu không có field, giữ nguyên
        const filtered = acts.filter(a => (a.is_active === undefined) ? true : !!a.is_active);

        // Sắp xếp: order_index ASC, sau đó updated_at DESC
        const sorted = [...filtered].sort((a, b) => {
          const ai = (a.order_index ?? Number.MAX_SAFE_INTEGER);
          const bi = (b.order_index ?? Number.MAX_SAFE_INTEGER);
          if (ai !== bi) return ai - bi;
          const au = new Date(a.updated_at || 0).getTime();
          const bu = new Date(b.updated_at || 0).getTime();
          return bu - au;
        });

        return [fid, sorted];
      })
    );
    const actionsByFlow = new Map(actionsByFlowEntries);

    // 4) Gộp theo từng trigger: action có trigger_id trùng hoặc action cấp flow (trigger_id = null)
    const result = [];
    for (const tr of triggers) {
      const flow = flowById.get(tr.flow_id);
      const flowMeta = {
        flow_id: (flow?.flow_id ?? tr.flow_id),
        name: flow?.name,
        description: flow?.description,
        is_active: (flow?.is_active ?? flow?.enabled),
      };

      const allFlowActions = actionsByFlow.get(tr.flow_id) || [];
      const perTriggerActions = allFlowActions
        .filter(a => a.flow_id === tr.flow_id && (a.trigger_id == null || a.trigger_id === tr.trigger_id))
        .map(a => (typeof a.toJSON === 'function' ? a.toJSON() : a));

      result.push({
        ...flowMeta,
        trigger: {
          trigger_id: tr.trigger_id,
          flow_id: tr.flow_id,
          event_type: tr.event_type,
          conditions: tr.conditions || {},
          is_active: !!tr.is_active,
        },
        actions: perTriggerActions,
      });
    }

    return result;
  }
}

module.exports = new AutomationFlowRepository();
