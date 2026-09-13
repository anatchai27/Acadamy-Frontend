# Finance Payment Status Policy

> Decision record: P0-02 Finance UI + API
> Decision date: 13 September 2026
> Scope: payment lifecycle, revenue report and finance export

## Decision

`payments.status` represents the payment lifecycle. It must not be used as the
slip-verification state.

### Payment lifecycle

| Status | Meaning | Included in revenue |
| --- | --- | --- |
| `pending` | Payment was recorded but money is not confirmed | No |
| `succeeded` | Money was received and confirmed | Yes |
| `failed` | Payment could not be completed | No |
| `cancelled` | Payment was cancelled before completion | No |
| `partially_refunded` | A completed payment was partially returned | Deferred until refund fields/workflow exist |
| `refunded` | A completed payment was fully returned | No |

Revenue currently includes only `succeeded`. Refund reporting is not enabled
until the database has an auditable refund amount and refund transaction flow.

### Slip verification

Slip verification is represented by the existing payment verification fields:

- `VerifiedAt`
- `VerifiedBy`
- `VerificationProvider`
- `VerificationPayload`
- `SlipAmount`
- `SlipTransRef`
- `SlipVerifiedAt`

The value `verified` is a provider/result state, not a payment lifecycle state.
When slip verification succeeds, the payment transitions to `succeeded`.

## Initial status by payment method

- `cash`: create as `succeeded` because the counter records money already received.
- `credit_card`: create as `succeeded` for the current manual POS flow. A future
  gateway flow must create `pending` and transition after gateway confirmation.
- `transfer`: create as `pending`; transition to `succeeded` after slip/manual
  verification succeeds.

## Amount policy

- Revenue uses `NetAmount` when it is present, otherwise `Amount`.
- `NetAmount` must not be interpreted as a refund amount.
- `partially_refunded` and `refunded` remain reserved values until a refund
  amount and transaction/audit contract is implemented.

## API and UI rules

- Revenue reports filter to `status = succeeded`.
- Finance history may display all payment lifecycle statuses.
- Finance UI must display the API-provided status and must not infer status from
  the payment method or slip URL.
- Revenue and CSV export must document whether they are revenue-only or a full
  payment ledger. The current `/api/payments/export` remains a full payment
  ledger export and includes the status column.
- Report date boundaries use inclusive calendar dates. The API normalizes the
  boundaries using the application timezone policy before querying.

## Allowed transitions

```text
pending -> succeeded
pending -> failed
pending -> cancelled
succeeded -> partially_refunded
succeeded -> refunded
partially_refunded -> refunded
```

Terminal states must not be moved back to `pending` by slip verification.

## Deferred items

- Payment gateway confirmation/webhook state machine
- Refund amount and refund transaction tables
- Production OCR/slip provider contract
- Runtime database evidence for report and export flows
