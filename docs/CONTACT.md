# Contact form and support notifications

`POST /api/contact` saves the message to D1 before scheduling an email
notification. A mail outage must not lose a support request or tell someone to
resubmit an already saved message. The admin inbox is the source of truth.

## Database setup

Apply migrations before deploying the corresponding code:

```sh
npx wrangler d1 migrations list spillarena-hub --remote
npx wrangler d1 migrations apply spillarena-hub --remote
```

`0013_contact_messages.sql` creates message storage. Its absence causes contact
submissions and the admin inbox to return `service_failed`.
`0014_contact_account_and_notification.sql` adds the verified account snapshot
and notification status. Both are additive and are also required locally.

## Domene.no SMTP

The public settings are in `wrangler.toml`:

| Setting | Value |
| --- | --- |
| Host | `ymirsgren.domene.no` |
| Port | `465` |
| Security | Implicit TLS, with certificate validation |
| Username | `support@spillarena.no` |
| Sender | `SpillArena <support@spillarena.no>` |
| Recipient | `support@spillarena.no` |

Set **SMTP_PASSWORD** to the mailbox password under Cloudflare → Workers &
Pages → spillarena → Settings → Variables and Secrets. Select **Secret**, not a
plain-text variable. Set it for the environment that should send mail, then
deploy. Never use a `VITE_` variable for a credential.

The CLI alternative prompts without putting the password in shell history:

```sh
npx wrangler pages secret put SMTP_PASSWORD --project-name spillarena
```

Local credentials belong in ignored `.dev.vars`. Leave `SMTP_PASSWORD` absent
for ordinary local testing to avoid sending real mail. No forwarding rule or
MX change is required to submit mail through this existing mailbox.

SMTP takes precedence when its host, username and password are configured.
The existing Resend integration remains available through `RESEND_API_KEY`
when SMTP is not configured. It requires a verified sending domain.
There is no automatic provider fallback after a failed send, since a timeout
can occur after a provider has accepted a message.

The sender and recipient are controlled on the server. The visitor's address
is `Reply-To`, so support can reply directly. Nodemailer handles MIME encoding
and SMTP framing, including Norwegian characters and multiline messages.
Connections have timeouts, and credentials/provider error bodies are never
included in application logs or contact records.

## Account details

Guests can send messages. A request carrying a session must pass the same
current-account and revocation checks as other account APIs. The server reads
only username, creation date and last activity time from the database. Client
supplied account fields are ignored. PINs, recovery codes, token contents and
gameplay documents are not attached.

The snapshot appears in the admin inbox and notification email. The form and
privacy policy explain what is included. An expired/revoked session signs out
the client and preserves the draft so the visitor can sign in or retry as a
guest.

## Notification status

- `not_configured`: no complete email credentials; message saved in the inbox.
- `pending`: background delivery has not recorded an outcome yet.
- `sent`: the SMTP/API provider accepted the notification; this does not prove
  inbox delivery.
- `failed`: delivery attempt failed; message remains in the inbox.
- `unknown`: an older message predating notification tracking.

Email is attempted once per new message. There is no automatic retry queue.
Persistent `pending` can mean the background task or its status update was
interrupted. Support can always use the saved message and its Reply button.

## Checks

```sh
npm run test:contact
npm run lint
npm run build
npx wrangler pages functions build --outdir /tmp/spillarena-functions \
  --compatibility-date 2026-09-01 --compatibility-flags nodejs_compat
```

Contact tests use the actual migration SQL in SQLite and mocked mail
transports; they send no email. An end-to-end delivery check additionally
requires deployed code, the mailbox secret, and an explicitly authorized test
message whose arrival is checked in the support mailbox.

References: [Cloudflare TLS support](https://developers.cloudflare.com/workers/runtime-apis/nodejs/tls/),
[Nodemailer SMTP options](https://nodemailer.com/smtp), and
[Resend send-email API](https://resend.com/docs/api-reference/emails/send-email).
