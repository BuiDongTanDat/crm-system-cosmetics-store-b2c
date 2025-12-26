// backend/src/Infrastructure/external/email_templates/TemplateRenderer.js

const templates = require('./templates');

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout({ subject, preheader, brandName, theme, contentHtml, nowYear }) {
  const primary = theme?.primary || '#111827';
  const secondary = theme?.secondary || '#6b7280';
  const bg = theme?.bg || '#f6f7fb';
  const card = theme?.card || '#ffffff';
  const radius = theme?.radius || '14px';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(subject || 'Email')}</title>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;background:${bg};">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background:${card};border-radius:${radius};overflow:hidden;border:1px solid #e9ecf3;">
          ${contentHtml}
          <tr>
            <td style="padding:14px 22px;border-top:1px solid #e9ecf3;font-size:12px;color:${secondary};">
              © ${esc(nowYear || new Date().getFullYear())} ${esc(brandName || 'MyShop')}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderTemplate(templateKey, ctx = {}) {
  const fn = templates[String(templateKey || '').trim()];
  if (!fn) return '';

  const subject = ctx.subject || 'Thông báo';
  const brandName = ctx.brand?.name || 'MyShop';
  const preheader = ctx.email?.preheader || '';
  const theme = ctx.theme || {};
  const nowYear = (ctx.now instanceof Date) ? ctx.now.getFullYear() : new Date().getFullYear();

  const contentHtml = fn(ctx);
  if (!contentHtml) return '';

  return layout({
    subject,
    preheader,
    brandName,
    theme,
    contentHtml,
    nowYear,
  });
}

module.exports = { renderTemplate };
