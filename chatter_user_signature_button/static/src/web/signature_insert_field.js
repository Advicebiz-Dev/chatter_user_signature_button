/** @odoo-module **/

import { Component, markup, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { user } from "@web/core/user";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { hasRenderedContent } from "../core/common/signature_html_utils";
import { standardFieldProps } from "@web/views/fields/standard_field_props";

const SIGNATURE_MARKER = 'data-chatter-user-signature="1"';
const SIGNATURE_SELECTOR = "[data-chatter-user-signature]";

/**
 * Add a signature to the *existing* HTML of a mail wizard.
 *
 * In particular, do not replace the active mail.template, use HTML-editor
 * regeneration, or overwrite email_layout_xmlid: quotations and invoices
 * can have important buttons and links in the rendered body, and the Odoo
 * notification footer is assembled separately by the server.
 */
export function appendSignaturePreservingBody(bodyHtml, signatureHtml) {
    const body = String(bodyHtml || "");
    const separator = hasRenderedContent(body) ? '<div class="o-paragraph"><br></div>' : "";
    const addition = `${separator}<div ${SIGNATURE_MARKER}>${signatureHtml}</div>`;

    // Normally wizard.body is an HTML fragment. Support complete HTML documents
    // too, without moving any of their existing tags or content.
    if (/<\/body\s*>/i.test(body)) {
        return body.replace(/<\/body\s*>/i, `${addition}$&`);
    }
    if (/<\/html\s*>/i.test(body)) {
        return body.replace(/<\/html\s*>/i, `${addition}$&`);
    }
    return `${body}${addition}`;
}

export class SignatureInsertField extends Component {
    static template = "chatter_user_signature_button.SignatureInsertField";
    static props = { ...standardFieldProps };

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.state = useState({ busy: false });
    }

    get label() {
        return _t("Add Signature");
    }

    async onClickInsertSignature() {
        if (this.state.busy || this.props.readonly) {
            return;
        }
        this.state.busy = true;
        try {
            const userId = user.userId;
            if (!userId) {
                this.notification.add(_t("It was not possible to identify the current user."), {
                    type: "warning",
                });
                return;
            }
            // Fetch on click so that edits in Preferences take effect immediately.
            const [resUser] = await this.orm.read("res.users", [userId], ["signature"]);
            const signatureHtml = resUser?.signature || "";
            if (!hasRenderedContent(signatureHtml)) {
                this.notification.add(
                    _t("Configure your email signature in My Profile before adding it."),
                    { type: "warning" }
                );
                return;
            }

            const record = this.props.record;
            const body = String(record.data.body || "");
            const container = document.createElement("div");
            container.innerHTML = body;
            if (
                container.querySelector(SIGNATURE_SELECTOR) ||
                body.includes(SIGNATURE_MARKER) ||
                // Avoid a second insertion when the template already contains
                // the exact saved user signature, even without our marker.
                body.includes(signatureHtml.trim())
            ) {
                this.notification.add(_t("Your signature is already in this message."), {
                    type: "info",
                });
                return;
            }

            const changes = {
                // Html fields in Odoo 19 must receive Markup: a plain string is
                // escaped by the editor and shown as literal HTML text.
                body: markup(appendSignaturePreservingBody(body, signatureHtml)),
            };
            // mail.compose.message normally appends a signature to emails with
            // no template. Disable only that *second* signature, and only when
            // the user explicitly presses this button. Never change the email
            // template, layout, recipients, attachments or other send options.
            if (Object.hasOwn(record.data, "email_add_signature")) {
                changes.email_add_signature = false;
            }
            await record.update(changes);
        } catch (error) {
            console.error("Signature insertion failed", error);
            this.notification.add(
                _t("It was not possible to refresh your signature. Please try again."),
                { type: "warning" }
            );
        } finally {
            this.state.busy = false;
        }
    }
}

registry.category("fields").add("user_signature_insert_button", {
    component: SignatureInsertField,
    displayName: _t("Add Signature"),
    supportedTypes: ["html"],
    isEmpty: () => false,
});
