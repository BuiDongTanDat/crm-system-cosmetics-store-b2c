// components/flow/conditionCatalog.js

// Operator list (bạn có thể map label ở UI)
export const OPS = [
    { value: "eq", label: "=" },
    { value: "neq", label: "≠" },
    { value: "gt", label: ">" },
    { value: "gte", label: ">=" },
    { value: "lt", label: "<" },
    { value: "lte", label: "<=" },
    { value: "contains", label: "contains" },
    { value: "in", label: "in" },
    { value: "not_in", label: "not in" },
    { value: "exists", label: "exists" },
];

// ===== Field sets theo entity trong ctx =====
// Lưu ý: path phải trỏ đúng ctx mà AutomationService.buildDefaultCtx tạo ra:
// ctx.lead, ctx.customer, ctx.order, ctx.campaign, ctx.campaign_channel, ctx.trigger...

export const ORDER_CONDITION_FIELDS = [
    { path: "order.total_amount", label: "Order / Total amount", type: "number" },
    { path: "order.status", label: "Order / Status", type: "select", options: ["new", "paid", "refunded", "cancelled"] },
    { path: "order.currency", label: "Order / Currency", type: "text" },
    { path: "order.created_at", label: "Order / Created at", type: "datetime" },
    { path: "order.customer_id", label: "Order / Customer ID", type: "text" },
];

export const LEAD_CONDITION_FIELDS = [
    {
        path: "lead.status",
        label: "Lead / Status",
        type: "select",
        options: ["new", "contacted", "qualified", "nurturing", "converted", "closed_lost"]
    },
    {
        path: "lead.source",
        label: "Lead / Source",
        type: "text",
        options: ["Organic", "Facebook", "Zalo", "Referral", "Cold Call", "Web Form"]
    },
    { path: "lead.tags", label: "Lead / Tags", type: "array_text" },
    { path: "lead.lead_score", label: "Lead / Score", type: "number" },
    { path: "lead.conversion_prob", label: "Lead / Conversion prob", type: "number" },
    { path: "lead.assigned_to", label: "Lead / Assigned to", type: "text" },
    { path: "lead.created_at", label: "Lead / Created at", type: "datetime" },
];

export const CUSTOMER_CONDITION_FIELDS = [
    { path: "customer.tags", label: "Customer / Tags", type: "array_text" },
    { path: "customer.email", label: "Customer / Email", type: "text" },
    { path: "customer.phone", label: "Customer / Phone", type: "text" },
    { path: "customer.full_name", label: "Customer / Name", type: "text" },
    {
        path: "customer.region",
        label: "Customer / Region",
        type: "text",
        options: ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Bình Dương"]
    },
    { path: "customer.created_at", label: "Customer / Created at", type: "datetime" },
];

export const CAMPAIGN_CONDITION_FIELDS = [
    { path: "campaign.status", label: "Campaign / Status", type: "select", options: ["draft", "active", "running", "paused", "ended"] },
    { path: "campaign.budget", label: "Campaign / Budget", type: "number" },
    { path: "conditions.age_min", label: "Target / Age min", type: "number" },
    { path: "conditions.age_max", label: "Target / Age max", type: "number" },
    { path: "conditions.regions", label: "Target / Regions", type: "array_text", options: ["Miền Bắc", "Miền Trung", "Miền Nam"] },
    { path: "conditions.interests", label: "Target / Interests", type: "array_text", options: ["Skincare", "Makeup", "Bodycare", "Fragrance"] },
];

export const CAMPAIGN_CHANNEL_CONDITION_FIELDS = [
    { path: "campaign_channel.channel", label: "Channel / Type", type: "select", options: ["email", "zalo", "sms", "facebook"] },
    { path: "campaign_channel.status", label: "Channel / Status", type: "select", options: ["draft", "active", "running", "paused", "ended"] },
    { path: "settings.merged.brand_name", label: "Settings / Brand name", type: "text" },
    { path: "campaign_channel.sent", label: "Channel / Sent", type: "number" },
    { path: "campaign_channel.delivered", label: "Channel / Delivered", type: "number" },
];

export const TAG_EVENT_CONDITION_FIELDS = [
    { path: "trigger.target_type", label: "Tag event / Target type", type: "select", options: ["lead", "customer"] },
    { path: "trigger.tag", label: "Tag event / Tag", type: "text", options: ["Vip", "Potential", "Churn", "Newbie"] },
];

export const ENGAGEMENT_CONDITION_FIELDS = [
    { path: "trigger.event", label: "Engagement / Event", type: "select", options: ["email_opened", "link_clicked", "form_submitted"] },
    { path: "trigger.template_key", label: "Engagement / Template key", type: "text" },
    { path: "trigger.url", label: "Engagement / Clicked URL", type: "text" },
];

export const CRON_CONDITION_FIELDS = [
    // cron.daily theo thiết kế của bạn: lọc theo trigger.job_key
    { path: "trigger.job_key", label: "Cron / Job key", type: "array_text" },
];

// ===== mapping theo event_type =====
export function getFieldsForEvent(eventType = "") {
    const ev = String(eventType || "");

    if (ev.startsWith("order.")) return ORDER_CONDITION_FIELDS;
    if (ev.startsWith("lead.")) return LEAD_CONDITION_FIELDS;
    if (ev.startsWith("customer.")) return CUSTOMER_CONDITION_FIELDS;

    if (ev.startsWith("campaign.channel.")) return CAMPAIGN_CHANNEL_CONDITION_FIELDS;
    if (ev.startsWith("campaign.")) return CAMPAIGN_CONDITION_FIELDS;

    if (ev.startsWith("tag.")) return TAG_EVENT_CONDITION_FIELDS;
    if (ev.startsWith("engagement.")) return ENGAGEMENT_CONDITION_FIELDS;

    if (ev === "cron.daily") return CRON_CONDITION_FIELDS;

    return [];
}
