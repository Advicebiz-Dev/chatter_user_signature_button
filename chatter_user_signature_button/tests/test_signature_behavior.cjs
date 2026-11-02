// Offline smoke tests for the small client-side field implementation.
// Run: node tests/test_signature_behavior.cjs
// This is NOT a substitute for an Odoo 19 Enterprise end-to-end test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const file = path.join(__dirname, '../static/src/web/signature_insert_field.js');
const code = fs.readFileSync(file, 'utf8')
    .replace(/^import .*;\s*$/gm, '')
    .replace(/\bexport (function|class) /g, '$1 ');
let registered;
let savedSignature = '<p><strong>Equipa AdviceBiz</strong></p>';
const changes = [];
const notifications = [];
const services = {
    orm: { async read(model, ids, fields) {
        assert.equal(model, 'res.users');
        assert.equal(ids[0], 7);
        assert.deepEqual(Array.from(fields), ['signature']);
        return [{ signature: savedSignature }];
    }},
    notification: { add: (...args) => notifications.push(args) },
};
const context = {
    Component: class Component {},
    markup: (v) => { const m = new String(v); m.__isMarkup = true; return m; },
    registry: { category: () => ({ add(name, obj) { registered = obj; }}) },
    _t: (txt) => txt,
    user: { userId: 7 },
    useService: (name) => {
        assert.notEqual(name, "user", "Odoo 19 must not ask for a user service");
        assert(services[name], `Service ${name} not found`);
        return services[name];
    },
    useState: (value) => value,
    hasRenderedContent: (v) => Boolean(String(v).replace(/<[^>]*>/g, '').trim() || /<(?:img|svg|picture)\b/i.test(String(v))),
    standardFieldProps: {},
    document: {
        createElement() { return {
            innerHTML: '',
            querySelector() { return this.innerHTML.includes('data-chatter-user-signature'); },
        }; },
    },
    console,
};
vm.runInNewContext(`${code}\nthis.makeField = SignatureInsertField; this.append = appendSignaturePreservingBody;`, context);
assert(registered && registered.supportedTypes[0] === 'html');
function makeRecord(body, opts = {}) {
    const data = { body, ...opts };
    return { data, async update(update) { changes.push(update); Object.assign(data, update); } };
}
function widget(record) {
    const obj = new context.makeField();
    obj.props = { name: 'body', readonly: false, record };
    obj.setup();
    return obj;
}
(async () => {
    const quote = '<div class="quote"><p>A sua proposta</p><a href="/my/orders/52?access_token=KEEP">Aceder à cotação</a><img src="/logo.png"></div>';
    const footerConfig = 'mail.mail_notification_layout_with_responsible_signature';
    const record = makeRecord(quote, {
        email_add_signature: true,
        email_layout_xmlid: footerConfig,
        template_id: 45,
        attachment_ids: [1, 2],
        partner_ids: [13],
    });
    assert.equal(changes.length, 0, 'No effect unless clicked');
    assert.equal(services.user, undefined, 'User service deliberately unavailable in this test');
    const instance = widget(record);
    await instance.onClickInsertSignature();
    assert.equal(changes.length, 1);
    assert(record.data.body.__isMarkup, 'Body must be sent to the html field as Markup');
    record.data.body = String(record.data.body);
    assert(record.data.body.startsWith(quote), 'Original HTML preserved byte for byte');
    assert(record.data.body.includes('href="/my/orders/52?access_token=KEEP"'), 'Quotation link retained');
    assert(record.data.body.includes('<img src="/logo.png">'), 'Quotation images retained');
    assert.equal(record.data.email_layout_xmlid, footerConfig, 'Odoo notification layout retained');
    assert.equal(record.data.template_id, 45, 'Quotation template retained');
    assert.deepEqual(record.data.attachment_ids, [1, 2], 'Attachments retained');
    assert.deepEqual(record.data.partner_ids, [13], 'Recipients retained');
    assert.equal(record.data.email_add_signature, false, 'No extra auto signature');
    assert.equal(record.data.body.split('data-chatter-user-signature').length - 1, 1);
    await instance.onClickInsertSignature();
    assert.equal(changes.length, 1, 'Double click must not insert twice');

    // Image-only signatures must be accepted and appended intact.
    savedSignature = '<div style="text-align:right"><img src="/web/image/4242" width="180" style="max-width:100%;border:0"></div>';
    const imageOnly = makeRecord('<p>Mensagem</p>');
    await widget(imageOnly).onClickInsertSignature();
    assert(imageOnly.data.body.includes(savedSignature), 'Image-only signature retained including alignment and attributes');
    savedSignature = '<p><strong>Equipa AdviceBiz</strong></p>';

    const invoice = makeRecord('<p>Invoice body</p>', { template_id: 58 });
    await widget(invoice).onClickInsertSignature();
    assert(invoice.data.body.startsWith('<p>Invoice body</p>'));
    assert.equal(Object.hasOwn(invoice.data, 'email_add_signature'), false,
        'Invoice wizard does not get an unknown mail field');
    assert.equal(invoice.data.template_id, 58);

    const before = '<html><body><a href="/portal/quotation">Aceder</a></body></html>';
    const after = context.append(before, savedSignature);
    assert(after.endsWith('</body></html>'), 'Insert inside a full HTML body');
    assert(after.includes('Aceder</a>'), 'Do not replace CTA');
    assert(!context.append('', savedSignature).includes('o-paragraph'), 'No spacing in empty body');

    savedSignature = '';
    const noSignature = makeRecord('<p>Sent without user signature</p>');
    const prevCount = changes.length;
    await widget(noSignature).onClickInsertSignature();
    assert.equal(changes.length, prevCount, 'Empty signature leaves draft unchanged');
    assert(notifications.length >= 2, 'Warn when needed');
    console.log('PASS: user lookup, quotation preservation, image-only signature, invoice, duplicate prevention, empty body.');
})().catch((err) => { console.error(err); process.exitCode = 1; });
