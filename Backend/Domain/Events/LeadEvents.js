const TriggerRegistry = require('../valueObjects/TriggerRegistry');

TriggerRegistry.register('lead.created', { domain: 'Lead', description: 'Lead được tạo' });
TriggerRegistry.register('lead.updated', { domain: 'Lead', description: 'Lead được cập nhật' });
TriggerRegistry.register('lead.tag_added', { domain: 'Lead', description: 'Lead được thêm tag' });

module.exports = {
  LEAD_CREATED: 'lead.created',
  LEAD_UPDATED: 'lead.updated',
  TAG_ADDED: 'lead.tag_added'
};
