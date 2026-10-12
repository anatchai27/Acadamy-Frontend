# Omise PromptPay integration preparation

The API-side Omise client is registered but does not initiate charges unless a server-side secret key is configured. No secret belongs in frontend environment files.

Configure these values as environment variables or through the deployment secret store:

- `Omise__SecretKey`: Omise test secret key initially; use the live key only after test-mode verification.
- `Omise__WebhookSecret`: Base64 webhook signing secret from the matching Omise environment.
- `Omise__PreviousWebhookSecret`: Optional previous signing secret during Omise's dual-signature rotation window.
- `Omise__ApiBaseUrl`: Optional; defaults to `https://api.omise.co/`.

PromptPay must also be enabled for the Omise account. The gateway client creates server-side THB PromptPay charges, uses Omise `ref_id` for retry protection, and verifies webhook signatures using the raw request body. A checkout endpoint, persistent payment lifecycle, and webhook settlement must be added before taking real payments; a charge response or browser redirect must never mark a payment as paid.

PromptPay documentation: <https://docs.omise.co/promptpay> and <https://docs.omise.co/api-webhooks>.