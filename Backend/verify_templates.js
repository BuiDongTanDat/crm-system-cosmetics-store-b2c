const { renderTemplate } = require('./Infrastructure/external/email_templates/TemplateRenderer');

const ctx = {
    brand: { name: 'Cosmetic Store' },
    customer: { full_name: 'Nguyễn Văn A' },
    lead: { name: 'Lê Văn B' },
    order: { order_id: 'ORD-TEST-001', total_amount: 500000, currency: 'VND' },
    order_items: [
        { name: 'Son môi cao cấp', price: 200000, currency: 'VND', image: 'https://via.placeholder.com/50' },
        { name: 'Kem dưỡng da', price: 300000, currency: 'VND' }
    ],
    campaign: { settings: { primary: '#e91e63' } }
};

const templatesToTest = ['order_receipt', 'order_confirm', 'birthday', 'vip_deals', 'welcome'];

console.log('--- STARTING TEMPLATE VERIFICATION ---');

templatesToTest.forEach(key => {
    try {
        console.log(`\nTesting template: [${key}]`);
        const html = renderTemplate(key, ctx);

        if (!html || html.trim() === '') {
            console.error(`  [FAIL] Template "${key}" returned empty string.`);
        } else {
            console.log(`  [OK] Template "${key}" rendered successfully (Length: ${html.length})`);
            // console.log(html.substring(0, 500) + '...'); // Uncomment to see snippet
        }
    } catch (err) {
        console.error(`  [ERROR] Failed to render "${key}":`, err.message);
    }
});

console.log('\n--- VERIFICATION COMPLETED ---');
