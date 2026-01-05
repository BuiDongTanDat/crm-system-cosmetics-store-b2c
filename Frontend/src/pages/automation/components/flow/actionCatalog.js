// frontend/src/components/automation/actionCatalog.js

export const formatLabel = (key) => {
  if (!key) return "";
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

export const normalizeSchema = (item) => {
  let rawFields = item?.config_schema?.fields;

  if (!rawFields) rawFields = item?.fields;
  if (!rawFields && Array.isArray(item?.config_schema)) rawFields = item.config_schema;

  if (Array.isArray(rawFields) && rawFields.length > 0) {
    return rawFields.map((f) => {
      if (typeof f === "string") {
        return { name: f, label: formatLabel(f), type: "text", required: false };
      }
      return f;
    });
  }

  return [];
};

export const ACTION_CATALOG = {
  send_email: {
    label: "Send Email",
    help: {
      when: "Dùng để gửi email cho lead/customer/order hoặc item trong for_each.",
      inputs: [
        "to: email người nhận (có thể dùng template {{ ... }})",
        "subject: tiêu đề",
        "template_key: (optional) dùng template renderer",
        "body: fallback html/text khi không có template_key",
        "email: { intro, message, footer_note } - dữ liệu đổ vào template",
        "theme: { brand_name } - thương hiệu"
      ],
      tips: [
        "Nếu template hỗ trợ email.message, hãy nhập vào đó thay vì body thô.",
        "Dùng {{ ... }} để lấy dữ liệu từ context (vd: {{ lead.name }})."
      ],
      example: {
        to: "{{ customer.email or lead.email }}",
        subject: "Chào mừng {{ lead.name or 'bạn' }}",
        template_key: "lead_welcome",
        email: {
          intro: "Cảm ơn bạn đã quan tâm.",
          message: "Chào mừng bạn gia nhập hệ thống. Vui lòng kiểm tra thông tin...",
          footer_note: "Trân trọng."
        },
        theme: { brand_name: "CChain" }
      }
    },
    fields: [
      { name: "to", label: "To", type: "text", required: true, placeholder: "{{ customer.email }}" },
      { name: "subject", label: "Subject", type: "text", required: true, placeholder: "..." },
      {
        name: "template_key", label: "Template Key", type: "select", required: false, options: [
          { value: "lead_welcome", label: "Lead Welcome" },
          { value: "campaign_blast", label: "Campaign Blast" },
          { value: "birthday", label: "Birthday Greetings" },
          { value: "vip_deals", label: "VIP Exclusive Deals" },
          { value: "order_created", label: "Order Created" },
          { value: "order_confirm", label: "Order Confirmation" },
          { value: "order_receipt", label: "Order Receipt/Payment" },
          { value: "order_processing", label: "Order Processing" },
          { value: "order_shipped", label: "Order Shipped" },
          { value: "order_completed", label: "Order Completed" },
          { value: "order_cancelled", label: "Order Cancelled" },
          { value: "order_failed", label: "Order Failed" },
          { value: "order_refunded", label: "Order Refunded" },
          { value: "system_notification", label: "System Notification" },
        ]
      },
      { name: "email_intro", label: "Email Intro", type: "text", required: false },
      { name: "email_message", label: "Email Message (Main Content)", type: "textarea", required: false },
      { name: "email_footer", label: "Email Footer Note", type: "text", required: false },
      { name: "theme_brand", label: "Brand Name", type: "text", required: false },
      { name: "body", label: "Body (Fallback / Legacy)", type: "textarea", required: false },
      { name: "cta_label", label: "CTA Label", type: "text", required: false },
      { name: "cta_url", label: "CTA URL", type: "text", required: false },
    ],
    mapToContent: (form) => {
      const out = {
        to: form.to,
        subject: form.subject,
        template_key: form.template_key || undefined,
        body: form.body || undefined,
        email: {
          intro: form.email_intro || undefined,
          message: form.email_message || undefined,
          footer_note: form.email_footer || undefined,
        },
        theme: {
          brand_name: form.theme_brand || undefined,
        }
      };
      if (form.cta_label || form.cta_url) {
        out.email.cta = {
          label: form.cta_label || "Xem thêm",
          url: form.cta_url || "#",
        };
      }
      return out;
    },
    mapFromContent: (content = {}) => ({
      to: content.to || "",
      subject: content.subject || "",
      template_key: content.template_key || "",
      body: content.body || "",
      email_intro: content?.email?.intro || "",
      email_message: content?.email?.message || "",
      email_footer: content?.email?.footer_note || "",
      theme_brand: content?.theme?.brand_name || "",
      cta_label: content?.email?.cta?.label || "",
      cta_url: content?.email?.cta?.url || "",
    }),
  },

  "query.customers": {
    label: "Query Customers",
    help: {
      when: "Dùng để lấy danh sách khách hàng (Customers) và lưu vào ctx.batch.",
      inputs: [
        "conditions: bộ lọc nâng cao (loại khách, ngày sinh, tags...).",
        "limit: giới hạn kết quả.",
        "save_to_ctx: lưu vào biến tùy chọn."
      ],
    },
    fields: [
      { name: "limit", label: "Limit", type: "number", required: false, placeholder: "5000" },
      { name: "save_to_ctx", label: "Save To Ctx", type: "text", required: false, placeholder: "batch" },
    ],
  },

  "query.leads": {
    label: "Query Leads",
    help: {
      when: "Dùng để lấy danh sách Leads theo điều kiện lọc và lưu vào ctx.batch.",
      inputs: [
        "conditions: bộ lọc nâng cao (status, nguồn, điểm số, tags, sinh nhật...).",
        "limit: giới hạn kết quả.",
        "save_to_ctx: lưu vào biến tùy chọn."
      ],
    },
    fields: [
      { name: "limit", label: "Limit", type: "number", required: false, placeholder: "5000" },
      { name: "save_to_ctx", label: "Save To Ctx", type: "text", required: false, placeholder: "batch" },
    ],
  },

  "query.orders": {
    label: "Query Orders",
    help: {
      when: "Dùng để lấy danh sách đơn hàng (Orders) và lưu vào ctx.batch.",
      inputs: [
        "conditions: bộ lọc nâng cao (trạng thái, ngày tạo, tổng tiền...).",
        "limit: giới hạn kết quả.",
        "save_to_ctx: lưu vào biến tùy chọn."
      ],
    },
    fields: [
      { name: "limit", label: "Limit", type: "number", required: false, placeholder: "5000" },
      { name: "save_to_ctx", label: "Save To Ctx", type: "text", required: false, placeholder: "batch" },
    ],
  },

  for_each: {
    label: "For Each",
    help: {
      when: "Lặp qua ctx.batch.items hoặc data ở from_path, rồi chạy nested action cho từng item.",
      inputs: [
        "from_path: đường dẫn tới batch (vd: batch) (optional)",
        "item_key: tên biến item trong ctx (vd: customer)",
        "next_action: action lồng (send_email/log/tag_update...)"
      ],
      tips: [
        "Nếu item_key = 'customer' thì send_email có thể dùng {{ customer.email }}.",
        "Nếu item_key khác, hãy dùng {{ <item_key>.email }} hoặc set cfg.item_key tương ứng."
      ],
      example: {
        from_path: "batch",
        item_key: "customer",
        next_action: { action_type: "send_email", content: { to: "{{ customer.email }}", subject: "Hello", body: "..." } }
      }
    },
    fields: [
      { name: "from_path", label: "From Path", type: "text", required: false, placeholder: "batch" },
      { name: "item_key", label: "Item Key", type: "text", required: true, placeholder: "customer" },
    ],
  },

  tag_update: {
    label: "Tag Update",
    help: {
      when: "Add/Remove tags cho Lead và/hoặc Customer (nếu tồn tại trong ctx).",
      inputs: [
        "op: add/remove",
        "tags: danh sách tag"
      ],
      tips: [
        "Backend sẽ apply cho lead nếu ctx.lead có và repo có addTags/removeTags.",
        "Backend sẽ apply cho customer nếu ctx.customer có và repo có addTags/removeTags."
      ],
      example: { op: "add", tags: ["Email Opened"] }
    },
    fields: [
      { name: "op", label: "Operation", type: "select", required: true, options: ["add", "remove"] },
      { name: "tags", label: "Tags", type: "tags", required: true },
    ],
  },

  update_status_if: {
    label: "Update Status If",
    help: {
      when: "Update status (thường là Lead) khi condition đúng. Ví dụ: email_opened → contacted.",
      inputs: [
        "condition: biểu thức JS trả về true/false (render qua nunjucks trước)",
        "to_status: status mới",
        "reason: (optional)"
      ],
      tips: [
        "Handler của bạn đang update Lead nếu ctx.lead.lead_id có và leadRepo.updateStatus tồn tại."
      ],
      example: { condition: "ctx.trigger.event==='engagement.email_opened'", to_status: "contacted", reason: "Email opened" }
    },
    fields: [
      { name: "condition", label: "Condition (JS expr)", type: "textarea", required: false },
      { name: "to_status", label: "To Status", type: "text", required: true, placeholder: "contacted" },
      { name: "reason", label: "Reason", type: "text", required: false, placeholder: "Automation" },
    ],
  },

  create_task: {
    label: "Create Task",
    help: {
      when: "Tạo một task mới dể nhắc nhở nhân viên hoặc quản lý.",
      inputs: [
        "title: Tiêu đề task",
        "description: Mô tả chi tiết",
        "due_in_minutes: Hạn hoàn thành tính từ lúc tạo",
        "priority: low, medium, high"
      ],
      example: {
        title: "Liên hệ lại với {{ lead.name }}",
        description: "Khách quan tâm serum, cần tư vấn thêm về giá.",
        due_in_minutes: 60,
        priority: "high"
      }
    },
    fields: [
      { name: "title", label: "Task Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: false },
      { name: "due_in_minutes", label: "Due In (Minutes)", type: "number", required: false, placeholder: "60" },
      {
        name: "priority", label: "Priority", type: "select", required: false, options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" }
        ]
      },
    ],
    mapToContent: (form) => ({ ...form }),
    mapFromContent: (content = {}) => ({
      title: content.title || "",
      description: content.description || "",
      due_in_minutes: content.due_in_minutes || "",
      priority: content.priority || "medium",
    }),
  },
};
