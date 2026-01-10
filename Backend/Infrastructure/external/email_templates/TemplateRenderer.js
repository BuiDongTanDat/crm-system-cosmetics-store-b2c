// backend/src/Infrastructure/external/email_templates/TemplateRenderer.js

const templates = require('./templates');

function renderTemplate(templateKey, ctx = {}) {
  const key = String(templateKey || '').trim();
  const fn = templates[key];
  if (typeof fn !== 'function') return '';

  let html = '';
  try {
    html = fn(ctx);
  } catch (err) {
    console.error(`[TemplateRenderer] Error rendering template "${key}":`, err.message || err);
    console.debug('[TemplateRenderer] Context snippet:', JSON.stringify(ctx || {}).substring(0, 200));
    return '';
  }

  if (typeof html !== 'string' || !html.trim()) return '';

  const trimmed = html.trim();

  // Nếu template đã là full HTML => return thẳng
  if (/^<!doctype\s+html>/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
    return trimmed;
  }

  // Fallback wrapper (khi template trả fragment)
  const merged = ctx?.settings?.merged || {};
  const cs = ctx?.campaign?.settings || {};

  const brandName =
    ctx?.brand?.name ||
    ctx?.theme?.brand_name ||
    merged.brand_name ||
    cs.brand_name ||
    'MyShop';

  const subjectPrefix = merged.subject_prefix || cs.subject_prefix || '';

  const baseSubject = ctx?.subject || `Thông báo từ ${brandName}`;
  const subject = subjectPrefix ? `${subjectPrefix}${baseSubject}` : baseSubject;

  const year = (ctx.now instanceof Date ? ctx.now : new Date()).getFullYear();

  const footerNote =
    merged.footer_note ||
    ctx?.settings?.campaign?.footer_note ||
    cs.footer_note ||
    ctx?.theme?.footer_note ||
    null;

  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:24px;background:#f6f7fb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:14px;
                      border:1px solid #e5e7eb;overflow:hidden;">
          <tbody>
            ${trimmed}
            ${footerNote ? `
<tr>
  <td style="padding:12px 20px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
    ${esc(footerNote)}
  </td>
</tr>` : ''}
<tr>
  <td style="padding:12px 20px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
    © ${year} ${esc(brandName)}
  </td>
</tr>
          </tbody>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { renderTemplate };
