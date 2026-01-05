
const eventTypeSvc = require('../../Application/Services/AutomationEventTypeService.js');
const actionTypeSvc = require('../../Application/Services/AutomationActionTypeService.js');

async function seedAutomationCatalog() {
  // ---- Event types (triggers)
  const eventTypes = [
    // Lead
    { event_type: 'lead.created', name: 'Lead Created', description: 'New lead created', payload_schema: { required: ['lead_id'] } },
    { event_type: 'lead.updated', name: 'Lead Updated', description: 'Lead updated', payload_schema: { required: ['lead_id'] } },

    // Order
    { event_type: 'order.created', name: 'Order Created', description: 'Order created', payload_schema: { required: ['order_id'] } },
    { event_type: 'order.paid', name: 'Order Paid', description: 'Order paid', payload_schema: { required: ['order_id'] } },
    { event_type: 'order.refunded', name: 'Order Refunded', description: 'Order refunded', payload_schema: { required: ['order_id'] } },

    // Tags
    { event_type: 'tag.added', name: 'Tag Added', description: 'Tag added on entity', payload_schema: { required: ['target_type', 'target_id', 'tag'] } },
    { event_type: 'tag.removed', name: 'Tag Removed', description: 'Tag removed on entity', payload_schema: { required: ['target_type', 'target_id', 'tag'] } },

    // Segment / scheduled
    { event_type: 'segment.scheduled', name: 'Segment Scheduled', description: 'Scheduled segment tick', payload_schema: { required: ['segment', 'flow_id', 'lead_id'] } },

    // Engagement
    { event_type: 'engagement.email_opened', name: 'Email Opened', description: 'Email opened', payload_schema: { required: ['lead_id'] } },
    { event_type: 'engagement.link_clicked', name: 'Link Clicked', description: 'CTA clicked', payload_schema: { required: ['lead_id'] } },
    { event_type: 'engagement.video_played', name: 'Video Played', description: 'Video played', payload_schema: { required: ['lead_id'] } },

    // Inbound channel
    { event_type: 'zalo.message', name: 'Zalo Message', description: 'Incoming Zalo message', payload_schema: { required: ['lead_id', 'message'] } },

    // Campaign
    { event_type: 'campaign.run', name: 'Campaign Run', description: 'Campaign run', payload_schema: { required: ['campaign_id'] } },
    { event_type: 'campaign.approved', name: 'Campaign Approved', description: 'Campaign approved', payload_schema: { required: ['campaign_id'] } },
    { event_type: 'campaign.pause', name: 'Campaign Pause', description: 'Campaign paused', payload_schema: { required: ['campaign_id'] } },
    { event_type: 'campaign.end', name: 'Campaign End', description: 'Campaign ended', payload_schema: { required: ['campaign_id'] } },

    // Campaign channel-level (flow-driven)
    { event_type: 'campaign.channel.run', name: 'Campaign Channel Run', description: 'Run a campaign channel', payload_schema: { required: ['campaign_id', 'channel_id'] } },
    { event_type: 'campaign.channel.pause', name: 'Campaign Channel Pause', description: 'Pause a campaign channel', payload_schema: { required: ['campaign_id', 'channel_id'] } },
    { event_type: 'campaign.channel.end', name: 'Campaign Channel End', description: 'End a campaign channel', payload_schema: { required: ['campaign_id', 'channel_id'] } },

    // Cron
    { event_type: 'cron.daily', name: 'Cron Daily', description: 'Daily cron tick', payload_schema: { required: [] } },
  ];

  // ---- Action types
  const actionTypes = [
    {
      action_type: 'send_email',
      name: 'Send Email',
      description: 'Send email to lead/customer',
      handler_kind: 'primitive',
      supported_channels: ['email'],
      config_schema: {
        version: 1,
        fields: ['to', 'subject', 'template_key', 'email', 'theme', 'body'],
        required: ['to', 'subject'],
        notes: 'Use template_key + email/theme. body is legacy fallback HTML.',
      },
    },
    {
      action_type: 'send_zalo',
      name: 'Send Zalo Message',
      description: 'Send Zalo OA message',
      handler_kind: 'primitive',
      supported_channels: ['zalo'],
      config_schema: { version: 1, fields: ['to', 'message', 'template_id', 'params'] },
    },
    {
      action_type: 'post_facebook',
      name: 'Post Facebook',
      description: 'Post to Facebook Page',
      handler_kind: 'primitive',
      supported_channels: ['facebook'],
      config_schema: { version: 1, fields: ['page_id', 'message', 'link', 'image_url'] },
    },
    {
      action_type: 'add_interaction',
      name: 'Add Interaction',
      description: 'Add lead/customer interaction event',
      handler_kind: 'primitive',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['type', 'score_delta', 'meta'] },
    },

    // NOTE: action này có trong catalog nhưng nếu runtime chưa có handler thì đừng dùng trong flow.
    {
      action_type: 'update_status_if',
      name: 'Update Status If',
      description: 'Update lead status if condition passes',
      handler_kind: 'primitive',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['condition', 'to_status', 'reason'] },
    },

    {
      action_type: 'tag_update',
      name: 'Tag Update',
      description: 'Add/remove tags on lead',
      handler_kind: 'primitive',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['op', 'tags'] },
    },
    {
      action_type: 'create_task',
      name: 'Create Task',
      description: 'Create follow-up task',
      handler_kind: 'primitive',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['type', 'title', 'description', 'assignee', 'due_in_minutes'] },
    },
    {
      action_type: 'schedule',
      name: 'Schedule Next Action',
      description: 'Schedule next action after delay',
      handler_kind: 'primitive',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['delay_minutes', 'delay_iso', 'next_action'] },
    },
    {
      action_type: 'log',
      name: 'Log',
      description: 'Log message',
      handler_kind: 'primitive',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['level', 'message', 'meta'] },
    },
    {
      action_type: 'http.request',
      name: 'HTTP Request',
      description: 'Call external API (AI/integration)',
      handler_kind: 'universal',
      supported_channels: ['http', 'internal'],
      config_schema: { version: 1, fields: ['method', 'url', 'headers', 'params', 'body', 'timeout_ms', 'save_to_ctx'] },
    },
    {
      action_type: 'set_ctx',
      name: 'Set Context',
      description: 'Set values into ctx by path',
      handler_kind: 'universal',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['path', 'value', 'values'] },
    },
    {
      action_type: 'branch',
      name: 'Branch',
      description: 'If/else branching',
      handler_kind: 'universal',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['condition', 'then_action', 'else_action'] },
    },
    {
      action_type: 'for_each',
      name: 'For Each',
      description: 'Loop actions for each item in batch',
      handler_kind: 'universal',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['from_path', 'item_key', 'next_action'] },
    },

    // Queries
    {
      action_type: 'query.leads',
      name: 'Query Leads',
      description: 'Query leads batch for scheduled jobs',
      handler_kind: 'universal',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['conditions', 'limit', 'save_to_ctx'] },
    },
    {
      action_type: 'query.customers',
      name: 'Query Customers',
      description: 'Query customers batch for scheduled jobs',
      handler_kind: 'universal',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['conditions', 'limit', 'save_to_ctx'] },
    },
    {
      action_type: 'query.orders',
      name: 'Query Orders',
      description: 'Query orders batch for scheduled jobs',
      handler_kind: 'universal',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['conditions', 'limit', 'save_to_ctx'] },
    },
    {
      action_type: 'query.products',
      name: 'Query Products',
      description: 'Query products for recommendations',
      handler_kind: 'universal',
      supported_channels: ['internal'],
      config_schema: { version: 1, fields: ['conditions', 'limit', 'save_to_ctx'] },
    },
  ];

  for (const e of eventTypes) await eventTypeSvc.upsert(e);
  for (const a of actionTypes) await actionTypeSvc.upsert(a);

  console.log('[Seed] Automation catalog seeded (idempotent).');
}

module.exports = { seedAutomationCatalog };
