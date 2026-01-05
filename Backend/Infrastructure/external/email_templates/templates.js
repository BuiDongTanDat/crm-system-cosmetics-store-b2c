// backend/src/Infrastructure/external/email_templates/templates.js

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

module.exports = {
    // 1) Order receipt (order.paid)
    order_receipt: (ctx) => {
        const e = ctx.email || {};
        const orderId = e.order_id || ctx.order?.order_id || 'N/A';
        const name = e.greeting_name || ctx.customer?.full_name || 'bạn';
        const total = money(e.total_amount ?? ctx.order?.total_amount, e.currency || ctx.order?.currency || 'VND');

    const subject = pickFirst(ctx.subject, `Biên nhận thanh toán - Đơn ${orderId}`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:18px 20px;background:#ecfdf5;border-bottom:1px solid #d1fae5;">
    <div style="font-size:16px;font-weight:900;color:#065f46;">${esc(e.title || 'Thanh toán thành công')}</div>
    <div style="font-size:12px;color:#047857;margin-top:6px;">Mã đơn: <strong>${esc(orderId)}</strong></div>
  </td>
</tr>
<tr>
  <td style="padding:18px 20px;line-height:1.7;">
    <p style="margin-top:0;">Chào ${esc(name)},</p>
    <p>${esc(e.body || 'Cảm ơn bạn. Đơn hàng đã được thanh toán thành công.')}</p>
    ${infoCard({ label: 'Tổng tiền', value: total, border: theme.border })}
    <p style="font-size:12px;color:${esc(theme.muted)};">Chúng tôi sẽ sớm bàn giao/ship đơn hàng.</p>
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
    const ctaText = pickFirst(e.cta_text, 'Thanh toán đơn hàng');

    const productsHtml = renderProducts(
      ctx.order_items || ctx.recommended_products || [],
      theme
    );

    const subject = pickFirst(ctx.subject, `Xác nhận đơn hàng ${orderId}`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:18px 20px;background:#fff7ed;border-bottom:1px solid #fed7aa;">
    <div style="font-size:16px;font-weight:900;color:#9a3412;">
      ${esc(e.title || 'Xác nhận đặt hàng')}
    </div>
    <div style="font-size:12px;color:#9a3412;margin-top:6px;">
      Mã đơn: <strong>${esc(orderId)}</strong>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:18px 20px;line-height:1.7;">
    <p style="margin-top:0;">Chào ${esc(name)},</p>
    <p>${esc(e.body || 'Vui lòng kiểm tra và thanh toán đơn hàng của bạn.')}</p>
    ${ctaButton({ url: ctaUrl, text: ctaText, bg: '#f97316' })}
    <div style="font-size:12px;color:${esc(theme.muted)};">
      Nếu bạn đã thanh toán, vui lòng bỏ qua email này.
    </div>
  </td>
</tr>
${productsHtml}`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

    // 3) Birthday
    birthday: (ctx) => {
        const e = ctx.email || {};
        const name = e.greeting_name || ctx.customer?.full_name || 'bạn';
        const coupon = e.coupon_code || 'HBD-10';
        const expire = e.expire_text || '7 ngày kể từ hôm nay';
        const ctaUrl = e.cta_url || '#';
        const ctaText = e.cta_text || 'Xem ưu đãi sinh nhật';
        const imageUrl = e.banner_url || 'https://static.vecteezy.com/system/resources/previews/000/672/896/non_2x/marketing-vector-banner-with-business-icons.jpg';

        return `
${imageUrl ? `
<tr><td style="padding:0;">
  <img src="${esc(bannerUrl)}" alt="Birthday" style="width:100%;display:block;" />
</td></tr>` : ''}

<tr>
  <td style="padding:20px 22px 8px 22px;">
    <div style="font-size:18px;font-weight:700;color:#111827;">Chúc mừng sinh nhật ${esc(name)}!</div>
    <div style="margin-top:8px;font-size:14px;line-height:20px;color:#4b5563;">
      ${esc(e.body || 'Chúc bạn một ngày thật nhiều niềm vui. Tặng bạn một mã ưu đãi sinh nhật để mua sắm các sản phẩm bạn yêu thích.')}
    </div>
  </td>
</tr>

<tr>
  <td style="padding:0 22px 18px 22px;">
    ${coupon ? `
    <div style="background:#f3f4f6;border-radius:12px;padding:12px 14px;border:1px solid ${esc(theme.border)};">
      <div style="font-size:13px;color:#374151;">Mã ưu đãi:</div>
      <div style="font-size:18px;font-weight:950;color:#111827;letter-spacing:1px;">
        ${esc(coupon)}
      </div>
      ${expire ? `<div style="font-size:12px;color:#6b7280;margin-top:6px;">HSD: ${esc(expire)}</div>` : ''}
    </div>` : ''}

    ${ctaButton({ url: ctaUrl, text: ctaText, bg: theme.primary })}
  </td>
</tr>`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  vip_deals: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);

    const name = pickFirst(ctx.customer?.full_name, e.greeting_name, 'bạn');
    const deal = pickFirst(e.vip_discount, e.offer_text, 'Giảm 15%');
    const ctaUrl = pickFirst(e.cta_url, '#');
    const ctaText = pickFirst(e.cta_text, 'Xem ưu đãi');

    const subject = pickFirst(ctx.subject, `Ưu đãi VIP hôm nay dành cho ${name}`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:18px 20px;background:#111827;color:#ffffff;">
    <div style="font-size:16px;font-weight:950;">${esc(e.title || 'Ưu đãi hôm nay dành riêng cho VIP')}</div>
    <div style="font-size:12px;opacity:0.9;margin-top:6px;">${esc(theme.brand_name)}</div>
  </td>
</tr>
<tr>
  <td style="padding:18px 20px;line-height:1.7;">
    <p style="margin-top:0;">Chào ${esc(name)},</p>
    <p>Hôm nay bạn có ưu đãi VIP: <strong>${esc(deal)}</strong></p>
    ${ctaButton({ url: ctaUrl, text: ctaText, bg: theme.primary })}
    <p style="margin-top:14px;font-size:12px;color:${esc(theme.muted)};">Bạn nhận email này vì thuộc nhóm khách hàng VIP.</p>
  </td>
</tr>`;
    },

    // 5) Welcome lead
    welcome: (ctx) => {
        const e = ctx.email || {};
        const name = e.greeting_name || lead?.name || 'Khách hàng mới của tôi';
        const ctaUrl = e.cta_url || ctx.trigger?.campaign_link || '#';
        const ctaText = e.cta_text || 'Khám phá ngay';
        const imageUrl = 'https://static.vecteezy.com/system/resources/previews/000/672/896/non_2x/marketing-vector-banner-with-business-icons.jpg';
        return `
${imageUrl ? `<tr><td style="padding:0;">
  <img src="${esc(imageUrl)}" alt="Welcome" style="width:100%;display:block;"/>
</td></tr>` : ''}

<tr>
  <td style="padding:18px 20px;background:linear-gradient(135deg,#ff6f91,#ff9671);color:#fff;text-align:center;">
    <div style="font-size:18px;font-weight:800;">${esc(e.title || 'Dịp 20/10 – Set Quà Tặng Đặc Biệt')}</div>
    <div style="font-size:13px;margin-top:6px;opacity:0.95;">${esc(e.subtitle || 'Rạng Rỡ Nét Đẹp Việt')}</div>
  </td>
</tr>
<tr>
  <td style="padding:18px 20px;line-height:1.7;">
    <p style="margin-top:0;">Chào ${esc(name)},</p>
    <p>${esc(e.body || 'Chúng tôi đã ghi nhận yêu cầu hoàn tiền cho đơn hàng của bạn.')}</p>
    ${infoCard({ label: 'Số tiền hoàn', value: refunded, border: theme.border })}
    <div style="font-size:12px;color:${esc(theme.muted)};">
      Thời gian hoàn tiền phụ thuộc ngân hàng/đơn vị thanh toán.
    </div>
  </td>
</tr>`;
    },
};
