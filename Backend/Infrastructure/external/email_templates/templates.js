/* eslint-disable no-console */

// ==========================================================
// EMAIL TEMPLATES (FULL HTML)
// - Utility helpers (escape, money, url)
// - Theme / campaign settings resolve
// - Layout blocks
// - wrapEmail()
// - Templates (each returns FULL HTML)
// ==========================================================

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

function safeUrl(u, fallback = '#') {
  const s = String(u || '').trim();
  return s ? s : fallback;
}

function firstName(full) {
  const s = String(full || '').trim();
  if (!s) return '';
  const parts = s.split(/\s+/);
  return parts[parts.length - 1];
}

// ------------------------
// Helpers to read ctx/email/trigger safely
// ------------------------
function pickFirst(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return null;
}

function ctxName(ctx) {
  const e = ctx?.email || {};
  return (
    pickFirst(
      e.greeting_name,
      ctx?.customer?.full_name,
      ctx?.lead?.name
    ) || 'bạn'
  );
}

// ------------------------
// Theme resolve
// ------------------------
function resolveTheme(ctx) {
  const t = (ctx && ctx.theme) ? ctx.theme : {};
  const merged = ctx?.settings?.merged || {};
  const cs = ctx?.campaign?.settings || {};

  const brandName =
    t.brand_name ||
    t.brandName ||
    merged.brand_name ||
    cs.brand_name ||
    ctx?.brand?.name ||
    'MyShop';

  return {
    brand_name: String(brandName || 'MyShop'),
    primary: t.primary || merged.primary || cs.primary || '#2563eb',
    secondary: t.secondary || merged.secondary || cs.secondary || '#6b7280',
    bg: t.bg || merged.bg || cs.bg || '#f6f7fb',
    card: t.card || merged.card || cs.card || '#ffffff',
    radius: t.radius || merged.radius || cs.radius || '14px',
    text: t.text || merged.text || cs.text || '#111827',
    muted: t.muted || merged.muted || cs.muted || '#6b7280',
    border: t.border || merged.border || cs.border || '#e5e7eb',
  };
}

// ------------------------
// NEW: normalize products from ctx
// Accept: ctx.interest_products | ctx.products | ctx.product | ctx.product_interests | ctx.recommended_products
// Output item format used by renderer: { product_id, name, price, currency, image_url, product_url, short_desc }
// ------------------------
function normalizeOneProduct(p = {}) {
  if (!p || typeof p !== 'object') return null;

  const product_id = p.product_id || p.id || p.sku_id || null;
  const name = pickFirst(p.name, p.product_name, p.title, p.productInterest, p.product_interest, '');
  if (!name) return null;

  return {
    product_id,
    name,
    price: p.price ?? p.price_current ?? p.unit_price ?? p.amount ?? 0,
    currency: p.currency || p.price_currency || 'VND',
    image_url: p.image_url || p.image || p.thumbnail_url || '',
    product_url: p.product_url || p.url || p.link || '',
    short_desc: p.short_desc || p.short_description || p.description || p.note || '',
    attrs: p.attrs || p.attributes || undefined,
  };
}

function normalizeProductsFromCtx(ctx = {}) {
  if (Array.isArray(ctx.interest_products) && ctx.interest_products.length) {
    return ctx.interest_products.map(normalizeOneProduct).filter(Boolean);
  }

  if (Array.isArray(ctx.products) && ctx.products.length) {
    return ctx.products.map(normalizeOneProduct).filter(Boolean);
  }

  if (ctx.product && typeof ctx.product === 'object') {
    const one = normalizeOneProduct(ctx.product);
    return one ? [one] : [];
  }

  if (Array.isArray(ctx.product_interests) && ctx.product_interests.length) {
    return ctx.product_interests.map(normalizeOneProduct).filter(Boolean);
  }

  if (Array.isArray(ctx.recommended_products) && ctx.recommended_products.length) {
    return ctx.recommended_products.map(normalizeOneProduct).filter(Boolean);
  }

  return [];
}

// ------------------------
// B: Campaign settings resolve (email content should come from campaign)
// ------------------------
function resolveCampaignEmailSettings(ctx = {}) {
  const e = ctx.email || {};
  const c = ctx.campaign || {};
  const cs = c.settings || {};
  const merged = (ctx.settings && (ctx.settings.merged || ctx.settings)) ? (ctx.settings.merged || ctx.settings) : {};

  const subject_prefix = pickFirst(
    e.subject_prefix,
    merged.subject_prefix,
    cs.subject_prefix,
    ''
  );
  const baseSubject = pickFirst(
    ctx.subject,
    e.subject,
    cs.subject,
    merged.subject,
    c.subject,
    c.name ? `${c.name}` : null
  );

  const subject = subject_prefix
    ? `${subject_prefix}${baseSubject || ''}`
    : baseSubject;

  const body_text = pickFirst(
    e.message,
    e.body_text,
    e.body,
    merged.body_text,
    merged.body,
    cs.body_text,
    cs.body,
    cs.content,
    c.body_text,
    c.description,
    ''
  );

  const body_html = pickFirst(
    e.body_html,
    merged.body_html,
    cs.body_html,
    ''
  );

  const intro = pickFirst(
    e.intro,
    merged.intro,
    cs.intro,
    ''
  );

  const title = pickFirst(
    e.title,
    merged.title,
    cs.title,
    c.name,
    'Thông báo chiến dịch'
  );

  const subtitle = pickFirst(
    e.subtitle,
    merged.subtitle,
    cs.subtitle,
    c.description,
    ''
  );

  const hero_image_url = pickFirst(
    e.banner_url,
    e.image_url,
    merged.hero_image_url,
    merged.banner_url,
    merged.image_url,
    cs.hero_image_url,
    cs.banner_url,
    cs.image_url,
    c.hero_image_url,
    c.heroImageUrl,
    c.image,
    ''
  );

  const landing_url = pickFirst(
    e.cta_url,
    merged.cta_url,
    merged.landing_url,
    cs.cta_url,
    cs.landing_url,
    '#'
  );

  const cta_text = pickFirst(
    e.cta_text,
    merged.cta_text,
    cs.cta_text,
    'Xem chi tiết'
  );

  const template_key = pickFirst(
    e.template_key,
    merged.template_key,
    cs.template_key,
    c.template_key
  );

  const from_name = pickFirst(e.from_name, merged.from_name, cs.from_name);
  const from_email = pickFirst(e.from_email, merged.from_email, cs.from_email);
  const reply_to = pickFirst(e.reply_to, merged.reply_to, cs.reply_to);

  const utm = cs.utm || merged.utm || c.utm || null;

  return {
    subject,
    subject_prefix,
    body_text,
    body_html,
    intro,
    title,
    subtitle,
    hero_image_url,
    landing_url,
    cta_text,
    template_key,
    from_name,
    from_email,
    reply_to,
    utm,
  };
}

// ------------------------
// Layout blocks
// ------------------------
function headlineBlock({ title, subtitle, bg = '#111827', color = '#ffffff' }) {
  return `
<tr>
  <td style="padding:18px 20px;background:${esc(bg)};color:${esc(color)};">
    <div style="font-size:18px;font-weight:800;line-height:1.2;">${esc(title || '')}</div>
    ${subtitle ? `<div style="font-size:13px;opacity:.92;margin-top:6px;line-height:1.4;">${esc(subtitle)}</div>` : ''}
  </td>
</tr>`;
}

function ctaButton({ url, text, bg = '#2563eb', color = '#ffffff' }) {
  return `
<div style="text-align:center;margin:18px 0;">
  <a href="${esc(safeUrl(url))}"
     style="display:inline-block;padding:12px 18px;background:${esc(bg)};color:${esc(color)};
            text-decoration:none;border-radius:999px;font-weight:800;font-size:14px;">
    ${esc(text || 'Xem ngay')} →
  </a>
</div>`;
}

function infoCard({ label, value, border = '#e5e7eb' }) {
  return `
  <div style="padding:10px 12px;border:1px solid ${esc(border)};border-radius:12px;margin:8px 0;background:#ffffff;">
    <div style="font-size:12px;color:#6b7280;">${esc(label || '')}</div>
    <div style="font-size:14px;font-weight:800;color:#111827;margin-top:4px;">${esc(value || '')}</div>
  </div>`;
}

function renderProducts(products = [], theme = {}) {
  if (!Array.isArray(products) || products.length === 0) return '';

  const border = theme.border || '#e5e7eb';
  const primary = theme.primary || '#2563eb';

  const normalized = products.map((p) => normalizeOneProduct(p) || p).filter(Boolean);

  return `
<tr>
  <td style="padding:16px 20px;">
    <div style="font-size:16px;font-weight:800;margin-bottom:12px;color:#111827;">
      Sản phẩm gợi ý cho bạn
    </div>
    ${normalized
      .map((p) => {
        const img = esc(p.image_url || '');
        const name = esc(p.name || '');
        const hasPrice = Number(p.price) > 0;
        const price = hasPrice ? money(p.price, p.currency || 'VND') : '';
        const url = p.product_url ? esc(p.product_url) : '';

        const desc =
          p.short_desc ? esc(String(p.short_desc)).slice(0, 140) + '…' : '';

        return `
      <div style="display:flex;margin-bottom:12px;border:1px solid ${esc(border)};border-radius:10px;overflow:hidden;background:#fff;">
        ${img ? `<img src="${img}" alt="${name}" style="width:96px;height:96px;object-fit:cover;" />` : ''}
        <div style="padding:10px 12px;flex:1;">
          <div style="font-weight:800;font-size:14px;color:#111827;">${name}</div>
          ${hasPrice ? `<div style="font-size:13px;color:#6b7280;margin:6px 0;">${esc(price)}</div>` : ''}
          ${desc ? `<div style="font-size:13px;color:#374151;line-height:1.5;margin:6px 0;">${desc}</div>` : ''}
          ${url
            ? `<a href="${url}" style="font-size:13px;color:${esc(primary)};text-decoration:none;font-weight:700;">
                 Xem sản phẩm →
               </a>`
            : ''
          }
        </div>
      </div>`;
      })
      .join('')}
  </td>
</tr>`;
}

function renderProductSection({ title, products = [], theme = {} }) {
  if (!Array.isArray(products) || products.length === 0) return '';

  return `
<tr>
  <td style="padding:16px 20px 6px 20px;">
    <div style="font-size:16px;font-weight:900;margin-bottom:8px;color:#111827;">
      ${esc(title || 'Sản phẩm')}
    </div>
    <div style="font-size:12px;color:${esc(theme.muted || '#6b7280')};">
      ${products.length} sản phẩm
    </div>
  </td>
</tr>
${renderProducts(products, theme)}
`;
}

function renderCouponBlock(coupon = {}, theme = {}) {
  const code = pickFirst(coupon.code, coupon.coupon_code, '');
  if (!code) return '';
  const expire = pickFirst(coupon.expire_text, coupon.expire, '');
  const desc = pickFirst(coupon.description, '');

  return `
<tr>
  <td style="padding:0 20px 18px 20px;">
    <div style="background:#f3f4f6;border-radius:12px;padding:12px 14px;border:1px solid ${esc(theme.border || '#e5e7eb')};">
      <div style="font-size:12px;color:#6b7280;">Mã giảm giá</div>
      <div style="font-size:20px;font-weight:950;color:#111827;letter-spacing:1px;margin-top:4px;">
        ${esc(code)}
      </div>
      ${desc ? `<div style="font-size:13px;color:#374151;margin-top:6px;">${esc(desc)}</div>` : ''}
      ${expire ? `<div style="font-size:12px;color:#6b7280;margin-top:6px;">HSD: ${esc(expire)}</div>` : ''}
    </div>
  </td>
</tr>`;
}

function renderTipsBlock(tips = [], theme = {}) {
  if (!Array.isArray(tips) || tips.length === 0) return '';
  return `
<tr>
  <td style="padding:0 20px 18px 20px;">
    <div style="padding:14px 14px;border:1px solid ${esc(theme.border || '#e5e7eb')};border-radius:12px;background:#ffffff;">
      <div style="font-size:14px;font-weight:900;color:#111827;margin-bottom:8px;">Mẹo sử dụng & bảo quản</div>
      <ul style="margin:0 0 0 18px;padding:0;font-size:14px;color:#374151;line-height:1.6;">
        ${tips.map((t) => `<li style="margin:6px 0;">${esc(t)}</li>`).join('')}
      </ul>
    </div>
  </td>
</tr>`;
}

// ------------------------
// wrapEmail (FULL HTML)
// FIX: render footer_note from ctx.settings.merged / campaign.settings
// ------------------------
function wrapEmail({ ctx, subject, bodyTrHtml }) {
  const theme = resolveTheme(ctx);
  const brand = esc(theme.brand_name);
  const year = new Date().getFullYear();

  const footerNote =
    ctx?.email?.footer_note ||
    ctx?.email?.footer ||
    ctx?.settings?.merged?.footer_note ||
    ctx?.campaign?.settings?.footer_note ||
    ctx?.settings?.campaign?.footer_note ||
    ctx?.theme?.footer_note ||
    '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${esc(subject || brand)}</title>
  </head>
  <body style="margin:0;padding:24px;background:${esc(theme.bg)};font-family:Arial,sans-serif;color:${esc(theme.text)};">
    <div style="max-width:680px;margin:0 auto;">
      <div style="padding:10px 4px;font-size:12px;color:${esc(theme.muted)};">
        ${brand}
      </div>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="border-collapse:separate;border-spacing:0;background:${esc(theme.card)};
                    border:1px solid ${esc(theme.border)};border-radius:${esc(theme.radius)};overflow:hidden;">
        <tbody>
          ${bodyTrHtml || ''}
          <tr>
            <td style="padding:14px 20px;border-top:1px solid ${esc(theme.border)};font-size:12px;color:${esc(theme.muted)};">
              ${footerNote ? `<div style="margin-bottom:8px;">${esc(footerNote)}</div>` : ''}
              © ${year} ${brand}. Nếu bạn không muốn nhận email, hãy bỏ qua email này.
            </td>
          </tr>
        </tbody>
      </table>

      <div style="padding:12px 4px;font-size:11px;color:${esc(theme.muted)};">
        Email tự động từ hệ thống.
      </div>
    </div>
  </body>
</html>`;
}

// ==========================================================
// TEMPLATES
// - Each returns FULL HTML
// ==========================================================
module.exports = {
  // ======================================================
  // ORDER EMAILS (PAYMENT)
  // ======================================================

  order_receipt: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);

    const orderId = pickFirst(e.order_id, ctx.order?.order_id, 'N/A');
    const name = ctxName(ctx);
    const total = money(
      (e.total_amount ?? ctx.order?.total_amount),
      (e.currency || ctx.order?.currency || 'VND')
    );

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

  // ======================================================
  // LIFECYCLE / CUSTOMER EVENTS
  // ======================================================

  birthday: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);

    const name = pickFirst(e.greeting_name, ctx.customer?.full_name, 'bạn');

    const coupon = pickFirst(e.coupon_code, ctx.trigger?.coupon_code, '');
    const expire = pickFirst(e.expire_text, ctx.trigger?.expire_text, '');
    const ctaUrl = pickFirst(e.cta_url, ctx.trigger?.cta_url, '#');
    const ctaText = pickFirst(e.cta_text, ctx.trigger?.cta_text, 'Xem ưu đãi sinh nhật');
    const bannerUrl = pickFirst(e.banner_url, ctx.trigger?.banner_url, '');

    const subject = pickFirst(ctx.subject, `Chúc mừng sinh nhật ${name}`, theme.brand_name);

    const intro = e.intro ? `<div style="font-size:15px;color:#111827;font-weight:700;margin-bottom:8px;">${esc(e.intro)}</div>` : '';
    const message = e.message || e.body || 'Chúc bạn một ngày thật nhiều niềm vui. Tặng bạn một mã ưu đãi sinh nhật để mua sắm các sản phẩm bạn yêu thích.';

    const body = `
${bannerUrl ? `
<tr><td style="padding:0;">
  <img src="${esc(bannerUrl)}" alt="Birthday" style="width:100%;display:block;" />
</td></tr>` : ''}

<tr>
  <td style="padding:20px 22px 8px 22px;">
    <div style="font-size:18px;font-weight:900;color:#111827;">Chúc mừng sinh nhật ${esc(name)}!</div>
    <div style="margin-top:8px;font-size:14px;line-height:1.6;color:#4b5563;">
      ${intro}
      ${esc(message)}
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

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  // ======================================================
  // LEAD EMAILS
  // ======================================================

  lead_welcome: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);

    const brand = theme.brand_name;
    const nameRaw = pickFirst(e.greeting_name, ctx.lead?.name, ctx.customer?.full_name, 'bạn');
    const name = firstName(nameRaw) || nameRaw;

    const ctaUrl = pickFirst(e.cta_url, ctx.campaign?.landing_url, ctx.trigger?.campaign_link, '#');
    const ctaText = pickFirst(e.cta_text, 'Khám phá ưu đãi');
    const heroImg = pickFirst(e.image_url, e.banner_url, ctx.campaign?.settings?.hero_image_url, ctx.campaign?.hero_image_url, '');

    const interestProducts = normalizeProductsFromCtx(ctx);

    const cross = Array.isArray(ctx.cross_sell_products)
      ? ctx.cross_sell_products.map(normalizeOneProduct).filter(Boolean)
      : [];

    const subject = pickFirst(ctx.subject, `Chào mừng ${name} đến với ${brand}`, brand);

    const intro = e.intro ? `<div style="font-size:15px;color:#111827;font-weight:700;margin-bottom:8px;">${esc(e.intro)}</div>` : '';
    const message = e.message || e.body || 'Bạn có thể bắt đầu bằng việc xem các sản phẩm phù hợp. Nếu cần tư vấn nhanh, chỉ cần trả lời email này.';

    const body = `
${heroImg ? `
<tr><td style="padding:0;">
  <img src="${esc(heroImg)}" alt="Hero" style="width:100%;display:block;" />
</td></tr>` : ''}

${headlineBlock({
      title: e.title || `Chào ${name}, ${brand} rất vui được đồng hành cùng bạn`,
      subtitle: e.subtitle || 'Bên dưới là sản phẩm bạn đang quan tâm',
      bg: '#0f172a',
    })}

<tr>
  <td style="padding:18px 20px;line-height:1.7;">
    <div style="font-size:14px;color:#374151;">
      ${intro}
      ${esc(message)}
    </div>
    ${ctaButton({ url: ctaUrl, text: ctaText, bg: theme.primary })}
    <div style="font-size:12px;color:${esc(theme.muted)};margin-top:10px;">
      Mẹo: cho ${esc(brand)} biết nhu cầu của bạn để chúng tôi gợi ý đúng hơn.
    </div>
  </td>
</tr>

${renderProductSection({ title: 'Sản phẩm bạn đang quan tâm', products: interestProducts, theme })}
${renderProductSection({ title: 'Gợi ý đi kèm phù hợp (Cross-sell)', products: cross, theme })}
`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  // ======================================================
  // CAMPAIGN EMAILS (EMAIL CHANNEL BLAST)
  // ======================================================

  campaign_blast: (ctx) => {
    const theme = resolveTheme(ctx);
    const brand = theme.brand_name;

    const cs = resolveCampaignEmailSettings(ctx);
    const ctaUrl = safeUrl(cs.landing_url);
    const ctaText = cs.cta_text || 'Xem chi tiết';

    const e = ctx.email || {};
    const nameRaw = pickFirst(e.greeting_name, ctx.customer?.full_name, ctx.lead?.name, 'bạn');
    const name = firstName(nameRaw) || nameRaw || 'bạn';

    const heroImg = cs.hero_image_url || '';
    const title = cs.title || ctx.campaign?.name || 'Thông báo chiến dịch';
    const subtitle = cs.subtitle || ctx.campaign?.description || '';

    // Final content resolution
    const finalHtml = cs.body_html || (cs.body_text ? `<p>${esc(cs.body_text)}</p>` : '');
    const subject = pickFirst(cs.subject, `${title} • ${brand}`, brand);

    const products = normalizeProductsFromCtx(ctx);

    const body = `
${heroImg ? `
<tr><td style="padding:0;">
  <img src="${esc(heroImg)}" alt="Banner" style="width:100%;display:block;" />
</td></tr>` : ''}

${headlineBlock({
      title,
      subtitle: subtitle || `Chào ${name}, cảm ơn bạn đã quan tâm đến ${brand}.`,
      bg: '#111827',
      color: '#ffffff'
    })}

<tr>
  <td style="padding:20px;line-height:1.6;color:#374151;font-size:15px;">
    ${finalHtml}
    ${ctaButton({ url: ctaUrl, text: ctaText, bg: theme.primary })}
    <div style="font-size:12px;color:${esc(theme.muted)};margin-top:12px;">
      Bạn nhận email này vì nằm trong danh sách khách hàng của chiến dịch.
    </div>
  </td>
</tr>

${renderProductSection({ title: 'Sản phẩm nổi bật', products, theme })}
`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  // ======================================================
  // SYSTEM EMAILS
  // ======================================================

  system_notification: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);

    const title = pickFirst(e.title, 'System Notification');
    const introHtml = e.intro ? `<div style="font-size:15px;color:#cbd5e1;font-weight:700;margin-bottom:8px;">${esc(e.intro)}</div>` : '';
    const bodyText = pickFirst(e.message, e.body_text, e.body, 'Thông báo từ hệ thống.');
    const meta = e.meta ? JSON.stringify(e.meta, null, 2) : '';

    const subject = pickFirst(ctx.subject, title, theme.brand_name);

    const body = `
${headlineBlock({ title, subtitle: 'Thông báo hệ thống', bg: '#0f172a' })}
<tr>
  <td style="padding:18px 20px;line-height:1.7;">
    <div style="font-size:14px;color:#374151;">
      ${introHtml}
      ${esc(bodyText)}
    </div>
    ${meta ? `
      <pre style="margin-top:12px;background:#0b1220;color:#e5e7eb;padding:12px;border-radius:12px;overflow:auto;font-size:12px;line-height:1.5;">${esc(meta)}</pre>
    ` : ''}
  </td>
</tr>`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  // ======================================================
  // ORDER EMAILS (REFUND)
  // ======================================================

  order_refunded: (ctx) => {
    const e = ctx.email || {};
    const theme = resolveTheme(ctx);

    const orderId = pickFirst(e.order_id, ctx.order?.order_id, 'N/A');
    const name = ctxName(ctx);

    const refunded = money(
      (e.refund_amount ?? ctx.order?.refund_amount ?? ctx.order?.total_amount ?? 0),
      (e.currency || ctx.order?.currency || 'VND')
    );

    const subject = pickFirst(ctx.subject, `Hoàn tiền đơn ${orderId}`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:18px 20px;background:#fef2f2;border-bottom:1px solid #fecaca;">
    <div style="font-size:16px;font-weight:950;color:#991b1b;">${esc(e.title || 'Thông báo hoàn tiền')}</div>
    <div style="font-size:12px;color:#991b1b;margin-top:6px;">Mã đơn: <strong>${esc(orderId)}</strong></div>
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

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  // ======================================================
  // ORDER STATUS EMAILS (NEWLY ADDED)
  // - Map gợi ý:
  //   pending    -> order_created
  //   processing -> order_processing
  //   shipped    -> order_shipped
  //   completed  -> order_completed
  //   cancelled  -> order_cancelled
  //   failed     -> order_failed
  // ======================================================

  order_created: (ctx) => {
    const theme = resolveTheme(ctx);
    const orderId = pickFirst(ctx.order?.order_id, 'N/A');
    const name = ctxName(ctx);

    const subject = pickFirst(ctx.subject, `Đơn hàng ${orderId} đã được tạo`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:18px 20px;background:#eef2ff;border-bottom:1px solid #c7d2fe;">
    <div style="font-size:16px;font-weight:900;color:#3730a3;">Đơn hàng đã được tạo</div>
    <div style="font-size:12px;color:#4338ca;margin-top:6px;">Mã đơn: <strong>${esc(orderId)}</strong></div>
  </td>
</tr>
<tr>
  <td style="padding:18px 20px;line-height:1.7;">
    <p>Chào ${esc(name)},</p>
    <p>Chúng tôi đã ghi nhận đơn hàng của bạn. Đơn hàng hiện đang chờ xử lý.</p>
    <p style="font-size:12px;color:${esc(theme.muted)};">Bạn sẽ nhận được email tiếp theo khi đơn hàng được xử lý.</p>
  </td>
</tr>`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  order_processing: (ctx) => {
    const theme = resolveTheme(ctx);
    const orderId = pickFirst(ctx.order?.order_id, 'N/A');
    const name = ctxName(ctx);

    const subject = pickFirst(ctx.subject, `Đơn hàng ${orderId} đang được xử lý`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:18px 20px;background:#ecfeff;border-bottom:1px solid #a5f3fc;">
    <div style="font-size:16px;font-weight:900;color:#155e75;">Đơn hàng đang được xử lý</div>
  </td>
</tr>
<tr>
  <td style="padding:18px 20px;line-height:1.7;">
    <p>Chào ${esc(name)},</p>
    <p>Đơn hàng <strong>${esc(orderId)}</strong> đang được chuẩn bị.</p>
    <p style="font-size:12px;color:${esc(theme.muted)};">Chúng tôi sẽ thông báo ngay khi đơn hàng được giao cho đơn vị vận chuyển.</p>
  </td>
</tr>`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  order_shipped: (ctx) => {
    const theme = resolveTheme(ctx);
    const orderId = pickFirst(ctx.order?.order_id, 'N/A');
    const name = ctxName(ctx);

    const subject = pickFirst(ctx.subject, `Đơn hàng ${orderId} đang được giao`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:18px 20px;background:#f0fdf4;border-bottom:1px solid #bbf7d0;">
    <div style="font-size:16px;font-weight:900;color:#166534;">Đơn hàng đã được giao cho vận chuyển</div>
  </td>
</tr>
<tr>
  <td style="padding:18px 20px;line-height:1.7;">
    <p>Chào ${esc(name)},</p>
    <p>Đơn hàng <strong>${esc(orderId)}</strong> hiện đang trên đường đến với bạn.</p>
    <p style="font-size:12px;color:${esc(theme.muted)};">Vui lòng chú ý điện thoại để nhận hàng.</p>
  </td>
</tr>`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  order_completed: (ctx) => {
    const theme = resolveTheme(ctx);
    const orderId = pickFirst(ctx.order?.order_id, 'N/A');
    const name = ctxName(ctx);

    const subject = pickFirst(ctx.subject, `Hoàn tất đơn hàng ${orderId}`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:18px 20px;background:#ecfdf5;border-bottom:1px solid #bbf7d0;">
    <div style="font-size:16px;font-weight:900;color:#065f46;">Đơn hàng đã hoàn tất</div>
  </td>
</tr>
<tr>
  <td style="padding:18px 20px;line-height:1.7;">
    <p>Chào ${esc(name)},</p>
    <p>Cảm ơn bạn đã mua sắm tại <strong>${esc(theme.brand_name)}</strong>.</p>
    <p style="font-size:12px;color:${esc(theme.muted)};">Chúng tôi mong được phục vụ bạn trong những lần tiếp theo.</p>
  </td>
</tr>`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  order_cancelled: (ctx) => {
    const theme = resolveTheme(ctx);
    const orderId = pickFirst(ctx.order?.order_id, 'N/A');
    const name = ctxName(ctx);

    const subject = pickFirst(ctx.subject, `Đơn hàng ${orderId} đã bị huỷ`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:18px 20px;background:#fef2f2;border-bottom:1px solid #fecaca;">
    <div style="font-size:16px;font-weight:900;color:#991b1b;">Đơn hàng đã bị huỷ</div>
  </td>
</tr>
<tr>
  <td style="padding:18px 20px;line-height:1.7;">
    <p>Chào ${esc(name)},</p>
    <p>Đơn hàng <strong>${esc(orderId)}</strong> đã được huỷ.</p>
    <p style="font-size:12px;color:${esc(theme.muted)};">Nếu có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ.</p>
  </td>
</tr>`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },

  order_failed: (ctx) => {
    const theme = resolveTheme(ctx);
    const orderId = pickFirst(ctx.order?.order_id, 'N/A');
    const name = ctxName(ctx);

    const subject = pickFirst(ctx.subject, `Thanh toán thất bại – Đơn ${orderId}`, theme.brand_name);

    const body = `
<tr>
  <td style="padding:18px 20px;background:#fff7ed;border-bottom:1px solid #fed7aa;">
    <div style="font-size:16px;font-weight:900;color:#9a3412;">Thanh toán không thành công</div>
  </td>
</tr>
<tr>
  <td style="padding:18px 20px;line-height:1.7;">
    <p>Chào ${esc(name)},</p>
    <p>Thanh toán cho đơn hàng <strong>${esc(orderId)}</strong> không thành công.</p>
    <p style="font-size:12px;color:${esc(theme.muted)};">Bạn có thể thử lại hoặc liên hệ hỗ trợ để được giúp đỡ.</p>
  </td>
</tr>`;

    return wrapEmail({ ctx, subject, bodyTrHtml: body });
  },
};
