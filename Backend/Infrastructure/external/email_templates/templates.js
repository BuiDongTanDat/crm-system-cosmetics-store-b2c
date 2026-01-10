function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(v, currency = 'VND') {
  const n = Number(v || 0);
  try {
    return new Intl.NumberFormat('vi-VN').format(n) + ' ' + currency;
  } catch {
    return `${n} ${currency}`;
  }
}

const BRAND_FALLBACK = 'MyShop';

function pickFirst(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== '') return v;
  return null;
}

function resolveTheme(ctx) {
  const merged = ctx?.settings?.merged || {};
  const cs = ctx?.campaign?.settings || {};
  return {
    primary: ctx?.theme?.primary || merged.primary || cs.primary || '#2563eb',
    border: ctx?.theme?.border || merged.border || cs.border || '#e5e7eb',
    muted: ctx?.theme?.muted || merged.muted || cs.muted || '#6b7280',
    brand_name: ctx?.brand?.name || ctx?.theme?.brand_name || merged.brand_name || cs.brand_name || BRAND_FALLBACK,
  };
}

function ctxName(ctx) {
  return (
    ctx?.email?.greeting_name ||
    ctx?.customer?.full_name ||
    ctx?.lead?.name ||
    'bạn'
  );
}

function ctaButton({ url, text, bg }) {
  if (!url || url === '#') return '';
  return `
<div style="margin:24px 0;text-align:center;">
  <a href="${esc(url)}" 
     style="background:${esc(bg)};color:#ffffff;padding:14px 32px;
            text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;
            font-size:15px;box-shadow:0 4px 12px rgba(0,0,0,0.15);
            transition:all 0.3s ease;letter-spacing:0.3px;">
    ${esc(text)}
  </a>
</div>`;
}

function infoCard({ label, value, border }) {
  return `
<div style="background:linear-gradient(135deg,#f9fafb,#ffffff);border:1px solid ${esc(border)};
            border-radius:12px;padding:16px 18px;margin:16px 0;
            box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <div style="font-size:12px;color:#6b7280;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">${esc(label)}</div>
  <div style="font-size:20px;font-weight:700;color:#111827;margin-top:6px;">${esc(value)}</div>
</div>`;
}

function renderProducts(products, theme) {
  if (!Array.isArray(products) || !products.length) return '';
  const rows = products.map(p => `
<div style="display:flex;align-items:center;padding:14px 0;border-bottom:1px solid ${esc(theme.border)};">
  ${p.image ? `<img src="${esc(p.image)}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-right:14px;box-shadow:0 2px 6px rgba(0,0,0,0.1);"/>` : ''}
  <div style="flex:1;">
    <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px;">${esc(p.name || 'Sản phẩm')}</div>
    <div style="font-size:13px;color:#e91e63;font-weight:600;">${money(p.price_current || p.price, p.currency)}</div>
  </div>
</div>`).join('');

  return `
<div style="margin-top:24px;background:#fafafa;border-radius:12px;padding:16px;">
  <div style="font-size:15px;font-weight:700;color:#374151;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e91e63;">
    ✨ Sản phẩm dành cho bạn
  </div>
  ${rows}
</div>`;
}

function wrapEmail({ ctx, subject, bodyTrHtml }) {
  // Nếu template trả về fragment, TemplateRenderer sẽ bọc nó bằng HTML skeleton.
  // Ở đây ta chỉ trả về các row <tr> cần thiết.
  return bodyTrHtml;
}

module.exports = {
  // 1) Order receipt (order.paid)
  order_receipt: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);
    const orderId = e.order_id || ctx.order?.order_id || 'N/A';
    const name = ctxName(ctx);
    const total = money(e.total_amount ?? ctx.order?.total_amount, e.currency || ctx.order?.currency || 'VND');

    const subject = pickFirst(ctx.subject, `Biên nhận thanh toán - Đơn ${orderId}`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:24px 28px;background:linear-gradient(135deg,#0d9488,#14b8a6);text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">✓</div>
    <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${esc(e.title || 'Thanh toán thành công')}</div>
    <div style="font-size:13px;color:#ffffff;margin-top:8px;opacity:0.95;">Mã đơn: <strong>${esc(orderId)}</strong></div>
  </td>
</tr>
<tr>
  <td style="padding:28px 24px;line-height:1.8;">
    <p style="margin:0 0 16px 0;font-size:15px;color:#374151;">Chào <strong style="color:#0d9488;">${esc(name)}</strong>,</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;">${esc(e.body || 'Cảm ơn bạn đã tin tưởng! Đơn hàng của bạn đã được thanh toán thành công.')}</p>
    ${infoCard({ label: 'Tổng tiền', value: total, border: theme.border })}
    <p style="font-size:13px;color:#9ca3af;margin:20px 0 0 0;padding:16px;background:#f9fafb;border-radius:8px;border-left:3px solid #0d9488;">💚 Chúng tôi sẽ sớm bàn giao/ship đơn hàng cho bạn.</p>
  </td>
</tr>`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  order_confirm: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);

    const orderId = pickFirst(e.order_id, ctx.order?.order_id, 'N/A');
    const name = ctxName(ctx);

    const ctaUrl = pickFirst(e.cta_url, ctx.payment?.url, '#');
    const ctaText = pickFirst(e.cta_text, 'Thanh toán ngay');

    const productsHtml = renderProducts(
      ctx.order_items || ctx.recommended_products || [],
      theme
    );

    const subject = pickFirst(ctx.subject, `Xác nhận đơn hàng ${orderId}`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:24px 28px;background:linear-gradient(135deg,#ec4899,#f472b6);text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">🛍️</div>
    <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
      ${esc(e.title || 'Xác nhận đặt hàng')}
    </div>
    <div style="font-size:13px;color:#ffffff;margin-top:8px;opacity:0.95;">
      Mã đơn: <strong>${esc(orderId)}</strong>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:28px 24px;line-height:1.8;">
    <p style="margin:0 0 16px 0;font-size:15px;color:#374151;">Chào <strong style="color:#ec4899;">${esc(name)}</strong>,</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;">${esc(e.body || 'Đơn hàng của bạn đã được xác nhận! Vui lòng thanh toán để chúng tôi xử lý đơn hàng.')}</p>
    ${ctaButton({ url: ctaUrl, text: ctaText, bg: '#ec4899' })}
    <div style="font-size:13px;color:#9ca3af;text-align:center;margin-top:16px;">
      Nếu bạn đã thanh toán, vui lòng bỏ qua email này.
    </div>
  </td>
</tr>
${productsHtml ? `<tr><td style="padding:0 24px 24px 24px;">${productsHtml}</td></tr>` : ''}`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  // 3) Birthday
  birthday: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);
    const name = ctxName(ctx);
    const coupon = e.coupon_code || 'HBD-10';
    const expire = e.expire_text || '7 ngày kể từ hôm nay';
    const ctaUrl = e.cta_url || '#';
    const ctaText = e.cta_text || 'Nhận quà ngay';
    const bannerUrl = e.banner_url || null;

    const subject = pickFirst(ctx.subject, `🎉 Chúc mừng sinh nhật ${name}!`, theme.brand_name);

    const body = `
${bannerUrl ? `
<tr><td style="padding:0;">
  <img src="${esc(bannerUrl)}" alt="Birthday" style="width:100%;display:block;border-radius:14px 14px 0 0;" />
</td></tr>` : ''}

<tr>
  <td style="padding:28px 24px;text-align:center;background:linear-gradient(135deg,#fef3c7,#fde68a);">
    <div style="font-size:52px;margin-bottom:12px;">🎂</div>
    <div style="font-size:22px;font-weight:700;color:#92400e;letter-spacing:0.5px;">Chúc mừng sinh nhật!</div>
    <div style="font-size:16px;color:#b45309;margin-top:8px;font-weight:600;">${esc(name)}</div>
  </td>
</tr>

<tr>
  <td style="padding:28px 24px;line-height:1.8;">
    <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;text-align:center;">
      ${esc(e.body || 'Chúc bạn một ngày sinh nhật tràn ngập niềm vui và hạnh phúc! Chúng tôi có món quà đặc biệt dành tặng bạn.')}
    </p>
    ${coupon ? `
    <div style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:16px;padding:20px;border:2px dashed #fb923c;text-align:center;margin:20px 0;box-shadow:0 4px 12px rgba(251,146,60,0.2);">
      <div style="font-size:13px;color:#c2410c;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🎁 Quà tặng sinh nhật</div>
      <div style="font-size:28px;font-weight:900;color:#ea580c;letter-spacing:2px;font-family:monospace;">
        ${esc(coupon)}
      </div>
      ${expire ? `<div style="font-size:12px;color:#f97316;margin-top:10px;">⏰ Có hiệu lực: ${esc(expire)}</div>` : ''}
    </div>` : ''}
    ${ctaButton({ url: ctaUrl, text: ctaText, bg: '#f97316' })}
  </td>
</tr>`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  vip_deals: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);

    const name = ctxName(ctx);
    const deal = pickFirst(e.vip_discount, e.offer_text, 'Giảm 15%');
    const ctaUrl = pickFirst(e.cta_url, '#');
    const ctaText = pickFirst(e.cta_text, 'Khám phá ngay');

    const subject = pickFirst(ctx.subject, `👑 Ưu đãi VIP dành riêng cho ${name}`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:28px 24px;background:linear-gradient(135deg,#581c87,#7c3aed);text-align:center;">
    <div style="font-size:52px;margin-bottom:12px;">👑</div>
    <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${esc(e.title || 'Ưu đãi VIP đặc biệt')}</div>
    <div style="font-size:13px;color:#ffffff;margin-top:8px;opacity:0.95;">${esc(theme.brand_name)}</div>
  </td>
</tr>
<tr>
  <td style="padding:28px 24px;line-height:1.8;">
    <p style="margin:0 0 16px 0;font-size:15px;color:#374151;">Chào <strong style="color:#7c3aed;">${esc(name)}</strong>,</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;">Với tư cách là khách hàng VIP, bạn được hưởng ưu đãi đặc biệt hôm nay:</p>
    <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:16px;padding:20px;text-align:center;margin:20px 0;border:2px solid #a78bfa;box-shadow:0 4px 12px rgba(124,58,237,0.15);">
      <div style="font-size:32px;font-weight:900;color:#7c3aed;margin-bottom:8px;">${esc(deal)}</div>
      <div style="font-size:13px;color:#6d28d9;font-weight:600;">Ưu đãi độc quyền VIP</div>
    </div>
    ${ctaButton({ url: ctaUrl, text: ctaText, bg: '#7c3aed' })}
    <p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:16px;">✨ Bạn nhận email này vì là thành viên VIP của chúng tôi</p>
  </td>
</tr>`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  // 5) Welcome (general)
  welcome: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);
    const name = ctxName(ctx);
    const ctaUrl = e.cta_url || ctx.trigger?.campaign_link || '#';
    const ctaText = e.cta_text || 'Bắt đầu ngay';
    const imageUrl = e.banner_url || null;

    const subject = pickFirst(ctx.subject, `Chào mừng bạn đến với ${theme.brand_name}`, theme.brand_name);

    const body = `
${imageUrl ? `<tr><td style="padding:0;">
  <img src="${esc(imageUrl)}" alt="Welcome" style="width:100%;display:block;border-radius:14px 14px 0 0;"/>
</td></tr>` : ''}

<tr>
  <td style="padding:28px 24px;background:linear-gradient(135deg,#ff6b9d,#ffa06b);text-align:center;">
    <div style="font-size:52px;margin-bottom:12px;">🌸</div>
    <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${esc(e.title || 'Chào mừng bạn đến với chúng tôi!')}</div>
    <div style="font-size:14px;color:#ffffff;margin-top:8px;opacity:0.95;">${esc(e.subtitle || 'Rạng Rỡ Nét Đẹp Việt')}</div>
  </td>
</tr>
<tr>
  <td style="padding:28px 24px;line-height:1.8;">
    <p style="margin:0 0 16px 0;font-size:15px;color:#374151;">Chào <strong style="color:#ff6b9d;">${esc(name)}</strong>,</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;">${esc(e.body || 'Cảm ơn bạn đã quan tâm! Chúng tôi rất vui được đồng hành cùng bạn trên hành trình làm đẹp và chăm sóc bản thân.')}</p>
    ${ctaButton({ url: ctaUrl, text: ctaText, bg: '#ff6b9d' })}
    <div style="font-size:13px;color:#9ca3af;text-align:center;margin-top:16px;padding:16px;background:#fff7ed;border-radius:8px;">
      ✨ Chúng tôi sẽ sớm gửi tặng bạn những ưu đãi đặc biệt!
    </div>
  </td>
</tr>`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  // 6) Lead welcome (lead.created)
  lead_welcome: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);
    const name = ctxName(ctx);
    const ctaUrl = e.cta_url || ctx.trigger?.campaign_link || '#';
    const ctaText = e.cta_text || 'Khám phá sản phẩm';
    const imageUrl = e.banner_url || ctx.campaign?.image || null;

    const productsHtml = renderProducts(
      ctx.products || ctx.recommended_products || [],
      theme
    );

    const subject = pickFirst(ctx.subject, `Chào mừng ${name} đến với ${theme.brand_name}`, theme.brand_name);

    const body = `
${imageUrl ? `<tr><td style="padding:0;">
  <img src="${esc(imageUrl)}" alt="Welcome" style="width:100%;display:block;border-radius:14px 14px 0 0;"/>
</td></tr>` : ''}

<tr>
  <td style="padding:28px 24px;background:linear-gradient(135deg,#f472b6,#fb7185);text-align:center;">
    <div style="font-size:52px;margin-bottom:12px;">💄</div>
    <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${esc(e.title || 'Chào mừng bạn đến với chúng tôi!')}</div>
    <div style="font-size:14px;color:#ffffff;margin-top:8px;opacity:0.95;">${esc(e.subtitle || 'Làm đẹp mỗi ngày cùng ' + theme.brand_name)}</div>
  </td>
</tr>
<tr>
  <td style="padding:28px 24px;line-height:1.8;">
    <p style="margin:0 0 16px 0;font-size:15px;color:#374151;">Chào <strong style="color:#ec4899;">${esc(name)}</strong>,</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;">${esc(e.body || 'Cảm ơn bạn đã quan tâm! Chúng tôi rất vui được đồng hành cùng bạn trên hành trình làm đẹp. Hãy khám phá những sản phẩm tuyệt vời dành riêng cho bạn.')}</p>
    ${ctaButton({ url: ctaUrl, text: ctaText, bg: '#ec4899' })}
  </td>
</tr>
${productsHtml ? `<tr><td style="padding:0 24px 24px 24px;">${productsHtml}</td></tr>` : ''}`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  // 7) Campaign blast (campaign.channel.run)
  campaign_blast: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);
    const name = ctxName(ctx);

    const campaignName = ctx.campaign?.name || 'Chiến dịch đặc biệt';
    const ctaUrl = pickFirst(e.cta_url, ctx.trigger?.campaign_link, '#');
    const ctaText = pickFirst(e.cta_text, 'Xem ngay');
    const bannerUrl = e.banner_url || ctx.campaign?.image || null;

    const productsHtml = renderProducts(
      ctx.products || ctx.recommended_products || [],
      theme
    );

    const subject = pickFirst(ctx.subject, campaignName, theme.brand_name);

    const body = `
${bannerUrl ? `
<tr><td style="padding:0;">
  <img src="${esc(bannerUrl)}" alt="Campaign" style="width:100%;display:block;border-radius:14px 14px 0 0;" />
</td></tr>` : ''}

<tr>
  <td style="padding:28px 24px;background:linear-gradient(135deg,#ec4899,#8b5cf6);text-align:center;">
    <div style="font-size:52px;margin-bottom:12px;">🎯</div>
    <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${esc(e.title || campaignName)}</div>
    <div style="font-size:14px;color:#ffffff;margin-top:8px;opacity:0.95;">${esc(e.subtitle || theme.brand_name)}</div>
  </td>
</tr>
<tr>
  <td style="padding:28px 24px;line-height:1.8;">
    <p style="margin:0 0 16px 0;font-size:15px;color:#374151;">Chào <strong style="color:#ec4899;">${esc(name)}</strong>,</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;">${esc(e.body || 'Chúng tôi có ưu đãi đặc biệt dành riêng cho bạn! Đừng bỏ lỡ cơ hội tuyệt vời này.')}</p>
    ${ctaButton({ url: ctaUrl, text: ctaText, bg: '#ec4899' })}
  </td>
</tr>
${productsHtml ? `<tr><td style="padding:0 24px 24px 24px;">${productsHtml}</td></tr>` : ''}`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },
};
