# ROOMO mobile verification, notifications, and commission tracking

This change is additive. It does not delete existing account, property, or reservation rows.

## 1. Configure Twilio (SMS + WhatsApp)

Create/configure a Twilio account and set up:
- An SMS-capable sender for the destination countries you support.
- A WhatsApp sender (the Twilio Sandbox is suitable for initial testing only).
- An approved WhatsApp OTP Content Template, if Twilio requires templates for your account's WhatsApp messages.
- An approved reservation-confirmation WhatsApp Content Template.

Copy the new variables from `.env.example` into your private `.env` file and set real values:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_SMS_FROM` (for example, your assigned Twilio number in E.164 format)
- `TWILIO_WHATSAPP_FROM` (format: `whatsapp:+14155238886` for the sandbox, or your approved sender)
- `TWILIO_WHATSAPP_OTP_CONTENT_SID`
- `TWILIO_WHATSAPP_RESERVATION_CONTENT_SID`

Never commit the real `.env` or provider credentials. The WhatsApp OTP template expects variable `1` to be the six-digit code. The reservation template expects variables: 1 guest/owner name, 2 reservation reference, 3 property title, 4 check-in date, 5 check-out date, 6 total amount. Make the approved template match those variables. WhatsApp template approval and sender availability depend on your provider/account.

OTP codes expire after 5 minutes, are stored as HMAC hashes, and allow at most five guesses. Resends have a 60-second cooldown and a five-per-hour limit per phone number. If either SMS or WhatsApp succeeds, signup can continue; failures are logged server-side. Reservation notifications are best-effort and are recorded in `notification_logs`.

## 2. Apply the database migration safely

From Terminal:

```bash
cd ~/Documents/Roomo/roomo-backend
npx prisma migrate deploy
npx prisma generate
```

Then restart the backend:

```bash
npm run dev
```

Do **not** run `prisma migrate reset`. The new migration only adds nullable phone fields, verification metadata, commission fields, and two new tables. Existing reservations are backfilled at a starting 10% commission rate; each new reservation snapshots the owner's current rate.

## 3. Guest signup payload

The guest registration endpoint now expects `phoneNumber` in international E.164 format:

```json
{
  "fullName": "Example Guest",
  "email": "guest@example.com",
  "phoneNumber": "+919876543210",
  "password": "a-long-password-at-least-12"
}
```

The signup page now collects the number and displays the OTP verification controls. The existing email verification still applies too. Verify the OTP with:

```http
POST /api/mobile-verification/verify
Content-Type: application/json

{"accountType":"GUEST","phoneNumber":"+919876543210","code":"123456"}
```

Use the actual code delivered by your provider; the example is illustrative only. For a resend:

```http
POST /api/mobile-verification/send
Content-Type: application/json

{"accountType":"GUEST","phoneNumber":"+919876543210"}
```

Existing Google guests can add/verify a number using `POST /api/mobile-verification/send-current` with their guest bearer token and body `{"phoneNumber":"+919876543210"}`. Reservation creation is blocked until `phoneVerified` is true.

## 4. Owner signup and verification

`POST /api/auth/register` now expects `phoneNumber` in the same E.164 format. It creates the account without issuing a login token and sends the OTP. Verify with `accountType: "OWNER"`, then sign in normally. Add a mobile number to an older signed-in account using `POST /api/mobile-verification/send-current` with its bearer token.

If an existing owner has no phone number, their account is preserved. Add the phone-number field and OTP UI to any owner signup form you use before production rollout.

## 5. Reservation notifications

When an owner confirms a reservation through `PATCH /api/reservations/owner/:id/decision`, ROOMO attempts both SMS and WhatsApp notifications to the guest and owner, then records the result in `notification_logs`. A messaging-provider outage does not undo a confirmed reservation.

## 6. Commission API (ADMIN only)

All routes below require the existing administrator bearer token:
- `GET /api/admin/commissions` — reservations, owner rates, booking value, commission due/paid totals.
- `PATCH /api/admin/commissions/owners/:ownerId/rate` with `{"commissionRate":12.5}` — set an owner's percentage (0–50).
- `PATCH /api/admin/commissions/reservations/:reservationId/payment` with `{"commissionStatus":"PAID","commissionNotes":"Settled by bank transfer"}` — mark a commission paid; `DUE` and `WAIVED` are also supported.

Example: a ₹6,000 reservation at 12.5% records ₹750 commission and ₹5,250 owner payout. Changing the owner's rate later affects only future reservations; the original reservation snapshot stays the same. These endpoints track commissions manually; they do not charge guests or transfer money automatically.

## 7. Smoke checks

After the migration and server restart:
1. Open `http://localhost:5001/api/health`; expect `{"status":"ok"}`.
2. Register a test guest with a number you control; confirm that OTP controls appear and the code arrives on configured channels.
3. Verify the code, finish the existing email verification, sign in, and try a reservation.
4. Confirm a test reservation as its owner; inspect the API response and `notification_logs`.
5. Sign in as an administrator and call `GET /api/admin/commissions`; update a test owner's rate and verify an existing reservation's snapshot does not change.

Use a test property and test phone numbers until the provider configuration and templates are confirmed.
