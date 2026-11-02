/** @odoo-module **/

import { markup } from "@odoo/owl";
import { createElementWithContent } from "@web/core/utils/html";

/**
 * Unlike Odoo's generic `isHtmlEmpty`, this check recognises image-only signatures.
 * Odoo's `isHtmlEmpty` deliberately ignores <img> (and other visual media), so a
 * company logo without accompanying text was treated as an empty signature.
 *
 * Always parse the HTML as markup. Passing a raw string to isHtmlEmpty would
 * make the helper inspect literal tag text instead of the rendered HTML.
 */
export function hasRenderedContent(html) {
    if (!html) {
        return false;
    }
    const root = createElementWithContent("div", markup(String(html)));
    return Boolean(
        root.textContent?.replace(/[\u200B-\u200D\uFEFF]/g, "").trim() ||
        root.querySelector("img, picture, svg, canvas, video, audio, object")
    );
}
