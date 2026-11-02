# Chatter User Signature Button — Odoo 19 (v19.0.1.3.2)

## Where the button appears

- In the chatter of business records, before **Send** (existing behavior).
- In **Compose Email** dialogs (`mail.compose.message`), including quotations,
  orders, CRM and the expanded/full chatter composer.
- In **Send & Print** invoice dialogs (`account.move.send.wizard`) when the
  sending method is Email.
- Notes/internal log entries in the expanded wizard are excluded (not email).
  The original inline-chatter notes behavior remains unchanged.

The button reads the logged-in user's latest `res.users.signature` **at click
 time**, inserts that HTML in the draft and prevents accidental duplicate
 insertion within the draft. No automatic insertion is performed on opening
 or sending any wizard.

## Quotation, invoice and standard email safeguards

- **No changes to** `mail.template`, `email_layout_xmlid`, email send methods,
  generated access URLs, the sale-quotation button, Odoo's notification footer,
  recipients or attachments.
- Existing email body HTML is preserved **as a string**; the signature is
  appended rather than rebuilding the whole body or resetting the template.
- For `mail.compose.message` only, clicking the button sets
  `email_add_signature=False` to avoid a *second* automatic signature.
- Sending without clicking the button retains standard Odoo behavior.
- Automatic system emails and the mass-mailing campaign designer are not
  modified. This module supplies manual buttons in the normal user-facing
  email composers, not an automatic signature rewrite for every outgoing mail.

## Fix in 19.0.1.3.1

- Fixes OWL `Service user is not available` when opening the quotation
  email composer: the field imports `user` from `@web/core/user` instead of
  calling `useService("user")`, which may not be registered in this environment.
- `orm` and `notification` remain injected as standard Odoo web services.
- No changes to the quotation email template, access link/button, default
  notification layout, footer, send actions or attachment handling.

## Fix in 19.0.1.3.2 — signatures with images

- The inline chatter and email wizard buttons now detect images as real content
  even when a signature consists only of a logo or image. Odoo's generic
  `isHtmlEmpty` ignores image-only content by design.
- The signature HTML is still inserted intact, preserving `<img>` URLs and
  attributes, table structure and inline alignment styles. No extra dashes.
- The existing email body, quotation access link, email template, notification
  footer and attachments continue to be left untouched.
- Image URLs must themselves be accessible: an image served only at
  `localhost` or behind a logged-in Odoo session cannot be displayed by
  recipients on other devices. The module does not make private images public.

## Dependencies

`mail` and `account` (invoice sending form). The same archive upgrades the
existing module; **do not install an additional copy alongside it**.

## Upgrade (preproduction first)

1. Back up the database, then replace the existing
   `chatter_user_signature_button` module folder with this version.
2. Restart Odoo and **upgrade** the already installed module (`-u
   chatter_user_signature_button` or Apps > Upgrade).
3. Clear/rebuild web assets as appropriate and Ctrl+F5.
4. Verify: chatter send, quotation "Send by Email" (with access button and
   normal footer), invoice "Send & Print", and manual signature insertion.

The JS / XML structure was reviewed against Odoo 19 public source. An
integration run against your actual Enterprise environment and its custom
modules is required before installing in production.
