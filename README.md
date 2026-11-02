# Chatter User Signature Button

Módulo personalizado para Odoo 19.

## Funcionalidades

- Adiciona o botão **"Adicionar Assinatura"** nos compositores de email do Odoo.
- Disponível no chatter, envio de cotações, encomendas, CRM e envio de faturas.
- Insere a assinatura atual do utilizador, definida nas Preferências.
- Evita a inserção duplicada da assinatura.
- Preserva a formatação HTML, incluindo imagens, tabelas e estilos.
- Não adiciona separadores ou traços adicionais.
- A assinatura é inserida apenas quando o utilizador clica no botão.

## Compatibilidade

- Mantém os modelos de email e o conteúdo original das mensagens.
- Não altera destinatários, anexos, botões de acesso a cotações ou rodapés.
- Mantém o comportamento nativo do Odoo quando o botão não é utilizado.
- Não interfere com emails automáticos ou campanhas de email marketing.

## Versão 19.0.1.3.2

- Corrige a inserção de assinaturas que contêm apenas imagens.
- Corrige o erro OWL `Service user is not available`.
- Evita a duplicação automática da assinatura nos compositores de email.
- Preserva a estrutura HTML e os links das imagens.

## Atualização

1. Substituir a pasta `chatter_user_signature_button`.
2. Reiniciar o Odoo.
3. Atualizar o módulo com `-u chatter_user_signature_button`.
4. Atualizar o navegador (`Ctrl + F5`).
5. Testar a inserção da assinatura no chatter, nas cotações e nas faturas.

**Dependências:** `mail` e `account`.
