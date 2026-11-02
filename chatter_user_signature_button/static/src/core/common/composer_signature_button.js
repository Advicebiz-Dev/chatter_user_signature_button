/** @odoo-module **/

import { Composer } from "@mail/core/common/composer";
import { markup, toRaw } from "@odoo/owl";
import { _t } from "@web/core/l10n/translation";
import { createElementWithContent } from "@web/core/utils/html";
import { hasRenderedContent } from "./signature_html_utils";
import { patch } from "@web/core/utils/patch";

const SIGNATURE_SELECTOR = "[data-chatter-user-signature]";

patch(Composer.prototype, {
    /**
     * Insert the signature currently stored on res.users.
     *
     * We deliberately fetch it at click time instead of using the Mail store,
     * because the store can retain the value that was loaded when the browser
     * session started. The value returned by ORM is already HTML and must be
     * inserted as HTML, not converted to text and not wrapped through
     * getSignatureBlock().
     */
    async onClickAddUserSignature() {
        const composer = toRaw(this.props.composer);
        const user = this.thread?.effectiveSelf?.main_user_id;

        if (!user?.id) {
            this.env.services.notification.add(
                _t("It was not possible to identify the current user."),
                { type: "warning" }
            );
            return;
        }

        let signatureHtml = "";
        try {
            const [freshUser] = await this.env.services.orm.read(
                "res.users",
                [user.id],
                ["signature"]
            );
            signatureHtml = freshUser?.signature || "";
        } catch {
            this.env.services.notification.add(
                _t("It was not possible to refresh your signature. Please try again."),
                { type: "warning" }
            );
            return;
        }

        const safeSignatureHtml = markup(signatureHtml || "");

        if (!hasRenderedContent(signatureHtml)) {
            this.env.services.notification.add(
                _t("Configure your email signature in My Profile before adding it."),
                { type: "warning" }
            );
            return;
        }

        const body = createElementWithContent("div", composer.composerHtml);
        if (body.querySelector(SIGNATURE_SELECTOR)) {
            this.env.services.notification.add(
                _t("Your signature is already in this message."),
                { type: "info" }
            );
            return;
        }

        if (hasRenderedContent(composer.composerHtml)) {
            const spacer = document.createElement("div");
            spacer.className = "o-paragraph";
            spacer.append(document.createElement("br"));
            body.append(spacer);
        }

        // res.users.signature is HTML. Parse it as HTML and place its nodes
        // inside our marker wrapper. Do not add Odoo's traditional "--".
        const signatureSource = createElementWithContent("div", safeSignatureHtml);
        const signature = document.createElement("div");
        signature.setAttribute("data-chatter-user-signature", "1");
        while (signatureSource.firstChild) {
            signature.append(signatureSource.firstChild);
        }
        body.append(signature);

        // The signature is already part of the message body, therefore Odoo
        // must not append another signature to outgoing email notifications.
        composer.emailAddSignature = false;
        composer.isDirty = true;
        composer.composerHtml = markup(body.innerHTML);
        composer.autofocus++;
    },
});
