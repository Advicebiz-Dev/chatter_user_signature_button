{
    "name": "Chatter User Signature Button",
    "summary": "Add the current user's signature in chatter and email composers without altering mail templates",
    "version": "19.0.1.3.3",
    "category": "Productivity/Discuss",
    "author": "Cátia Silva Advicebiz",
    "license": "LGPL-3",
    "depends": ["mail", "account"],
    "data": [
        "views/mail_compose_message_views.xml",
        "views/account_move_send_wizard_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "chatter_user_signature_button/static/src/core/common/signature_html_utils.js",
            "chatter_user_signature_button/static/src/core/common/composer_signature_button.js",
            "chatter_user_signature_button/static/src/core/common/composer_signature_button.xml",
            "chatter_user_signature_button/static/src/web/signature_insert_field.js",
            "chatter_user_signature_button/static/src/web/signature_insert_field.xml",
        ],
    },
    "installable": True,
    "application": False,
}
