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

## Free email notifications with Resend

Resend's Free plan includes 3,000 emails per month, limited to 100 per day.
The contact API uses its HTTPS endpoint, which works from Pages Functions and
avoids SMTP networking. No Cloudflare Workers Paid plan is needed. The plan
does not automatically charge for overages; sending stops at the free limits
unless the account is upgraded.

Create a free Resend account, add `spillarena.no` as a sending domain, and
publish the DNS records Resend gives you in Cloudflare DNS. Keep existing MX
records so the Domene.no mailbox continues receiving email; merge any SPF
record changes with the existing SPF record instead of creating a second SPF
record. Wait until Resend marks the domain verified.

Then save the Resend API key as the encrypted `RESEND_API_KEY` secret in the
Cloudflare Pages project's production environment and deploy. In the dashboard
choose **Workers & Pages → spillarena → Settings → Variables and Secrets → Add**,
name it `RESEND_API_KEY`, and select **Secret**. The CLI also prompts for the
value without echoing it:

```sh
npx wrangler pages secret put RESEND_API_KEY --project-name spillarena
```

The sender and recipient remain fixed to `support@spillarena.no`; the visitor's
address is `Reply-To`, so support can reply directly. Resend is tried before
the existing Domene.no SMTP fallback. Keep Resend's pay-as-you-go/overage option
off to prevent charges; the free plan is capped at 3,000 per month and 100 per
day.

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

- `not_configured`: no email provider credentials; message saved in the inbox.
- `pending`: background delivery has not recorded an outcome yet.
- `sent`: the email provider accepted the notification; this does not prove
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
requires a verified Resend domain, the API key secret, deployed Pages code,
and a test message whose arrival is checked in the support mailbox.

References: [Resend pricing](https://resend.com/pricing),
[Resend domain verification](https://resend.com/docs/dashboard/domains/introduction), and
[Resend send-email API](https://resend.com/docs/api-reference/emails/send-email).
