# Get NoLostDocs live

Use this guide in order. It is written for this repository, **AWS Amplify Hosting**, and **Supabase**.

**Target website:** `https://nolostdocs.rmoddel.com`  
**Web app folder:** `apps`  
**Build configuration:** `amplify.yml` at the repository root  
**Guide checked:** September 15, 2026

Nothing below has already been deployed for you. Dashboard settings and production credentials still need to be checked.

## 1. Decide what you are launching

**You can put the current app online for a limited, password-protected preview using sample documents.** It includes login, browser camera capture, upload, document organization, encrypted cloud storage, and retrieval in the browser that saved the file.

**Do not open it as a public document-recovery service yet.** These items still need coding and validation:

| Missing work | Why it matters |
|---|---|
| Encryption-key recovery across browsers/devices | A lost device or cleared browser data can permanently prevent opening saved files. Signing in again does not recover the key. |
| Password-reset screen and tested recovery flow | SMTP configuration alone does not provide a complete “forgot password” experience. |
| Rate limits and abandoned-upload cleanup | Document-count limits do not prevent contact spam or unlimited abandoned storage objects. |
| Complete purchase/billing flow | The Stripe webhook exists, but checkout, customer billing management, and reliable event reconciliation are unfinished. Required only before charging users. |
| Staging security and real-browser testing | Database isolation, camera behavior, and complete save/retrieve flows still need verification. |

Scanbot and ABBYY are **not required** to launch the browser scanner. Their integrations are unfinished; skip their license fields. Do not promise OCR or automatic text extraction.

For the full technical assessment, see [PRODUCTION-LAUNCH.md](docs/PRODUCTION-LAUNCH.md).

## 2. Gather access and tools

You need:

- Access to the Git repository and permission to push the release branch.
- An AWS account with access to the Amplify app.
- Access to DNS for `rmoddel.com`.
- Access to the intended Supabase project and its database password.
- An email provider that supplies SMTP credentials and sender-domain verification records.
- Google Cloud access if you want the existing Google sign-in button to work.
- Node.js **22.18 or newer in the Node 22 line**, npm, Git, and the Supabase CLI.
- Docker Desktop running for local database tests.

Open Terminal in the repository:

```sh
cd /Users/rmoddel/code/rmo/work/noLostDocs
node --version
npm --version
supabase --version
```

On another computer, use the folder where you cloned the repository. If Supabase CLI is missing, follow its [official installation instructions](https://supabase.com/docs/guides/local-development/cli/getting-started).

Use a **separate Supabase staging project** for sample-data testing. Repeat the backend steps against production only after staging passes. Do not run experimental tests against real customer records.

## 3. Write down your three public app values

In the Supabase dashboard, select the correct project. Use its **Connect** panel or **Project Settings → API Keys** to find the project URL and publishable key.

Keep these values in a password manager or your deployment notes:

| Name | Value to use |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://nolostdocs.rmoddel.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your project URL, such as `https://YOUR_PROJECT_REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The project’s **publishable** key |
| `AMPLIFY_MONOREPO_APP_ROOT` | `apps` — this is for Amplify only |

`YOUR_PROJECT_REF` is the project identifier, not its display name. Replace that placeholder in later commands.

**Never use a service-role or secret key as the publishable key.** Variables starting with `NEXT_PUBLIC_` are included in browser code.

For local checks, create `apps/.env.local` **only if it does not already exist**:

```sh
cp -n apps/.env.local.example apps/.env.local
```

Open that file in your editor and set the first three values. For staging/local testing, use the staging backend and the actual test website URL; local development can use `http://127.0.0.1:3001`. Leave the Scanbot placeholder unused or remove that line.

**Success check:** all three values refer to the environment you intend to test. No real secrets are in committed files.

## 4. Run the local checks

From the repository root:

```sh
npm ci
npm run test:security-scan
npm run typecheck
npm run build:web
npm audit --omit=dev
```

Run each command only after the preceding command succeeds. The build should finish and show a **Middleware** entry.

Then start Docker Desktop and run:

```sh
supabase start
supabase test db --local
```

These commands target the **local** database. They do not validate production settings. If an existing local instance is missing migrations, check `supabase migration list --local` and use the CLI’s local migration workflow; do not reset a database containing data you need.

**Success check:** application checks and database tests pass. If PostgreSQL reports “connection refused,” the local database is not running. Do not mark the database tests passed or substitute the production database.

## 5. Link Supabase and apply the database migrations

Start with staging. In Terminal:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase migration list --linked
supabase db push --dry-run
```

Enter the database password if prompted. Do not put it in a command that will be saved in shell history.

Read the dry-run output. Verify the project is correct and that only expected pending migrations are listed. For a project containing existing data, confirm a backup is available before applying changes.

Apply the migrations:

```sh
supabase db push
supabase migration list --linked
```

The reviewed repository includes migrations through:

```text
20260908033028_security_overhaul_priority_list.sql
```

If newer migrations exist when you follow this guide, review them too. If Supabase reports mismatched migration history, **stop and reconcile the history**. Do not use `migration repair`, `db reset`, or `--include-all` just to make the error disappear.

In Supabase, open **Table Editor**. Confirm you can see:

- `profiles`, `devices`, and `document_profiles`
- `document_categories` and `document_types`
- `documents` and `document_files`
- `subscriptions`, `audit_events`, and `contact_requests`

Categories and system document types are inserted by migrations. The optional `seed.sql` is not a production setup script.

Open **Security Advisor** and review findings. Confirm Row Level Security is enabled on user-data tables.

**Success check:** local and remote migration histories match, required tables exist, and categories/types have their expected rows.

## 6. Configure private file storage

In Supabase, open **Storage → user-documents → bucket settings**.

Set or confirm:

| Setting | Required value |
|---|---|
| Bucket name | `user-documents` |
| Public bucket | **Off** |
| Allowed MIME types | `application/octet-stream` |
| Maximum file size | `10,485,776` bytes if exact bytes are supported; otherwise **11 MiB** |

The app accepts originals up to 10 MiB. Encryption adds 16 bytes, so a bucket cap of exactly 10 MiB would reject a maximum-size encrypted file.

Check the Storage policies. The hardening migration removes direct client read/write policies for this bucket. The app obtains authorized signed URLs from Edge Functions instead.

Do not add a public-read or general authenticated-upload policy to fix a failed upload. Check the function logs and configuration first.

**Success check:** the bucket is private, direct unauthorized access is denied, and later app upload/download tests work.

## 7. Deploy the backend functions

Hosted Supabase functions normally receive `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` automatically. This repository’s backend helper accepts that built-in service-role value.

If your environment requires a custom override, add **`SERVICE_ROLE_KEY`** under **Edge Functions → Secrets**, using the intended project’s service-role credential. Keep it out of Amplify browser variables, screenshots, and source control. Do not attempt to set reserved `SUPABASE_` secret names yourself.

Deploy the protected functions, one command at a time:

```sh
supabase functions deploy register-device --project-ref YOUR_PROJECT_REF --use-api
supabase functions deploy lock-device --project-ref YOUR_PROJECT_REF --use-api
supabase functions deploy unlock-device --project-ref YOUR_PROJECT_REF --use-api
supabase functions deploy create-signed-upload --project-ref YOUR_PROJECT_REF --use-api
supabase functions deploy create-signed-download --project-ref YOUR_PROJECT_REF --use-api
supabase functions deploy cleanup-uploaded-file --project-ref YOUR_PROJECT_REF --use-api
supabase functions deploy audit-log --project-ref YOUR_PROJECT_REF --use-api
```

`--use-api` lets the CLI bundle for deployment without using Docker. These commands leave gateway JWT verification enabled. Each protected function also checks the signed-in user in its own code. [Supabase function authentication](https://supabase.com/docs/guides/functions/auth)

The contact form supports visitors who are not signed in, so its deployment is different:

```sh
supabase functions deploy contact-submit --project-ref YOUR_PROJECT_REF --use-api --no-verify-jwt
```

This makes the contact endpoint public. Deploy it for controlled testing, but implement endpoint-level abuse protection before a public launch. Protecting the Amplify website does not protect the separate Supabase endpoint.

Do **not** deploy Stripe for the first preview. Step 13 explains the later billing setup.

**Success check:** all eight functions appear in the selected project. Protected functions reject requests without a valid user session. A sample contact request creates a `contact_requests` row.

## 8. Configure login and confirmation email

### Website and callback URLs

In **Supabase → Authentication → URL Configuration**, set the production Site URL:

```text
https://nolostdocs.rmoddel.com
```

Add the callback URLs used by this app:

```text
https://nolostdocs.rmoddel.com/auth/callback
https://nolostdocs.rmoddel.com/auth/callback?next=%2Fdashboard
https://nolostdocs.rmoddel.com/auth/confirm
```

The app sends a `next` query parameter on OAuth callbacks. If additional destination paths need allowlisting, add those exact callback URLs after testing them. Avoid a wildcard covering every Amplify deployment.

For staging, use the exact staging hostname instead. Keep localhost callbacks in the development/staging project rather than production.

### SMTP

In **Authentication → Email / SMTP settings**:

1. Enable custom SMTP.
2. Enter the SMTP host, port, username, and password from your email provider.
3. Set a sender address on your verified domain and sender name `NoLostDocs`.
4. At your DNS provider, add the sender-verification, SPF, and DKIM records supplied by the email provider. Configure DMARC for that domain.
5. Disable email link tracking for authentication emails.
6. Send a test email and confirm it arrives in an ordinary mailbox.

Enable email/password sign-in and **email confirmation**. Set a server-enforced password policy and appropriate email/OTP rate limits. Do not enable CAPTCHA until the app has the matching frontend integration.

### Confirmation email template

In **Authentication → Email Templates → Confirm signup**, use this link for the confirmation button:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email">Confirm your NoLostDocs account</a>
```

The app already has the matching `/auth/confirm` route. It verifies the token and sends the user to their dashboard. Keep this template for signup confirmation; do not reuse it blindly for password reset or invitations, which use different flows. [Supabase server-side confirmation guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs)

**Success check:** create a sample account, receive its email, click the link, and reach the dashboard on the intended hostname. Sign out and sign in again with its password.

## 9. Configure Google sign-in

The current login page displays a Google sign-in button. Configure it for the release, or have the button hidden in code before releasing an email-only experience.

1. In Google Cloud, select the intended project.
2. Configure the Google Auth Platform branding/consent screen, support email, audience, and authorized domain.
3. Create an OAuth client with application type **Web application**.
4. Add `https://nolostdocs.rmoddel.com` as an authorized JavaScript origin.
5. In Supabase **Authentication → Sign In / Providers → Google**, copy the provider callback URL. It normally has this form:

   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

6. Paste that URL into Google’s **Authorized redirect URIs**. This Google-to-Supabase callback is different from the app’s `/auth/callback` URL.
7. Copy the Google client ID and secret into Supabase’s Google provider settings and enable the provider.
8. While Google is in testing mode, add the intended test users. Complete Google’s required publishing/verification steps before making it generally available.

**Success check:** Google sign-in returns to the correct NoLostDocs dashboard. [Google provider setup](https://supabase.com/docs/guides/auth/social-login/auth-google)

## 10. Put the release code in Git

Amplify deploys the code in the connected remote Git branch. It cannot deploy changes that exist only on your laptop.

Review the pending files:

```sh
git status --short
git diff
git diff --cached
```

Using your editor’s Source Control panel, stage the intended release changes, including new scanner, middleware, test, and UI files. Do not stage secret files or discard existing unrelated work. Commit the reviewed changes and push the branch you intend Amplify to build.

If that branch already has automatic deployment enabled, the push can immediately start a deployment. Finish configuring its preview access controls and environment first, or temporarily disable automatic builds.

**Success check:** the Git provider shows the intended release commit, including `apps/middleware.ts`, on the selected branch.

## 11. Configure Amplify, deploy, and connect the domain

### App and build settings

Open **AWS Console → Amplify**. Reuse the existing NoLostDocs app if one exists. Otherwise choose **Create new app**, connect the Git provider, and select the repository and release branch.

Use these settings:

| Setting | Value |
|---|---|
| App is a monorepo | Yes |
| App root | `apps` |
| `AMPLIFY_MONOREPO_APP_ROOT` | `apps` |
| Build config | Repository-root `amplify.yml` |
| Node version | Node 22, matching local verification |
| Install command | `npm ci` from repository root |
| Build command | `npm run build -w @nolostdocs/web` |
| Build output | `apps/.next` |

The checked-in `amplify.yml` already supplies the install/build/output settings. Use Next.js server-side hosting, not static-export hosting, and do not add a blanket “all URLs → index.html” rewrite. [Amplify monorepo setup](https://docs.aws.amazon.com/amplify/latest/userguide/monorepo-configuration.html)

Under **Hosting → Environment variables**, enter the four values from Step 3 for the correct branch. Rebuild whenever a `NEXT_PUBLIC_` value changes.

### Limit access during preview

In Amplify’s **Access control** settings, password-protect the preview branch. Give the preview password only to your testers. [Amplify branch access control](https://docs.aws.amazon.com/amplify/latest/userguide/access-control.html)

Create the intended test accounts, then turn off **Allow new users to sign up** in Supabase Auth while previewing. Existing accounts can still sign in. An Amplify password alone does not restrict direct Supabase signup requests.

### Deploy

Start a build or redeploy the latest release commit. Wait for build and deployment to succeed. Check the logs for the expected Next.js build and Middleware output.

### Domain

Under **Hosting → Custom domains / Domain management**:

1. Add `rmoddel.com` if it is not already connected.
2. Map the `nolostdocs` subdomain to the release branch.
3. If DNS is outside Route 53, copy **the exact records Amplify provides** into your DNS provider. Do not guess the CNAME target.
4. Preserve certificate-validation records so renewal continues to work.
5. Wait until domain verification and the managed certificate are complete.
6. Open `https://nolostdocs.rmoddel.com` and confirm there is no certificate warning.

Use the canonical custom domain for final auth tests. If you first test on an Amplify hostname, configure that exact URL in the staging environment and auth allowlist; then change to the canonical production URL and rebuild.

If choosing a different permanent domain, also update `apps/constants/brand.ts`, `apps/public/sitemap.xml`, and `apps/public/robots.txt`; those contain the current hostname.

**Success check:** the intended release loads at the custom HTTPS domain, and signed-out visitors reach login.

## 12. Prove the deployed preview works

Use sample files with no real identity, medical, financial, or other sensitive data.

- [ ] `/` leads to the app/login flow; `/dashboard` requires sign-in.
- [ ] Signup confirmation, password sign-in, Google sign-in, and sign-out work.
- [ ] The dashboard has a default owner/profile and usable categories/types.
- [ ] Camera permission works on a phone; denying permission still allows file upload.
- [ ] A JPG can be selected, rotated, optionally enhanced, restored, and saved.
- [ ] Double-clicking Save does not create two records.
- [ ] A PDF can be saved and downloaded.
- [ ] Empty and oversized files produce useful errors.
- [ ] A saved file opens again after refreshing the **same browser**.
- [ ] Another browser cannot decrypt it; the missing-key error is expected with the current implementation.
- [ ] A second test account cannot list or retrieve the first account’s records.
- [ ] Locked browsers cannot obtain new signed file links; unlocking requires recent authentication. Test via the authenticated device functions if the active UI does not expose device controls.
- [ ] Sign-out removes protected record/preview access.
- [ ] A contact request appears in `contact_requests` and someone is responsible for reading it.
- [ ] Keyboard users can enter/leave dialogs; Escape closes only the top dialog.
- [ ] The phone layout has no unusable buttons or horizontal overflow.
- [ ] Security/privacy pages explain the browser-key recovery limit.

Check these public paths too:

```text
/login
/security
/privacy
/contact
/site.webmanifest
/sitemap.xml
/og-image.png
```

In browser developer tools, confirm protected pages are not publicly cached and responses include `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`. Check function logs for errors without copying credentials, file contents, or signed URLs into support tickets.

**Success check:** all applicable checks pass. The app is now an online preview, still under restricted access.

## 13. Finish the public-launch requirements

Before removing preview restrictions:

- [ ] Complete the required unfinished work in Step 1, especially encryption-key recovery and password reset.
- [ ] Test recovery on a fresh browser with a deliberately removed original test-browser key.
- [ ] Apply and verify the same reviewed migrations/functions in production.
- [ ] Protect administrative accounts with MFA and review who has access.
- [ ] Configure database backups/PITR to your recovery needs, and separately back up encrypted Storage objects. Database backups do not contain the object bytes or browser keys.
- [ ] Complete a restore drill.
- [ ] Add uptime/error alerts, spending/storage alerts, and an incident-response owner.
- [ ] Protect public functions against abuse, and implement abandoned-upload cleanup.
- [ ] Finalize retention, deletion, privacy, terms, support, and vendor-review processes.
- [ ] Repeat Step 12 on production using sample accounts.

Then enable the intended signup policy and remove Amplify’s preview password. A green deployment alone is not the public-launch approval criterion. [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)

### Stripe: only when the paid flow is implemented

Skip this entire subsection for a free preview.

1. Implement and test checkout, customer billing management, and subscription reconciliation.
2. Create the intended products/prices in Stripe test mode.
3. Add this webhook destination:

   ```text
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   ```

4. Subscribe it to `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
5. Store the endpoint signing secret as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets.
6. Ensure the trusted checkout backend sets subscription metadata `user_id` to the Supabase user UUID and `plan` to `premium`. Do not let browsers choose another user’s entitlement.
7. Deploy:

   ```sh
   supabase functions deploy stripe-webhook --project-ref YOUR_PROJECT_REF --use-api --no-verify-jwt
   ```

8. Test successful payment, cancellation, failures, duplicate events, and out-of-order events. Stripe authenticates with its signature, not a Supabase session. Confirm forged signatures are rejected.
9. Repeat with live-mode products and the **live endpoint’s own signing secret** only when ready to charge customers.

## If something breaks

| Symptom | First checks |
|---|---|
| Sign-in is disabled | Amplify public env values are missing or placeholders. Correct them and rebuild. |
| Login returns to the wrong hostname | Check `NEXT_PUBLIC_SITE_URL`, Supabase Site URL, and callback allowlist. |
| Confirmation email never arrives | Check SMTP credentials, sender verification, provider logs, spam folder, and auth email limits. |
| Google reports redirect mismatch | Google must allow the Supabase provider callback; Supabase must allow the app callback. |
| Function returns 401 | Sign out/in, confirm the session belongs to the same Supabase project, and inspect function logs. Do not broadly disable JWT checks. |
| Upload says the browser is not registered | Check `register-device` deployment/logs; sign in again to satisfy recent-auth requirements. |
| Upload fails near 10 MiB | Check the bucket cap includes the encryption overhead. |
| Storage permission error | Check migrations, private bucket, function auth, and service-role configuration. Do not make the bucket public. |
| Categories or document types are empty | Confirm migrations and profile-creation behavior; inspect RLS errors. |
| File cannot open in another browser | Current encryption-key recovery limitation; changing environment variables cannot fix it. |
| Contact works but nobody receives email | The function stores rows; it does not send support notifications. Assign someone to review the table or implement notifications. |
| Supabase reports migration-history mismatch | Stop and compare histories before changing anything. |

### Roll back safely

If the new web release breaks, redeploy the last known-good web commit through Amplify. Keep preview restrictions in place and pause additional deployments while investigating.

Web rollback does **not** roll back Supabase migrations or Edge Functions. Restore compatible function code separately. Have a reviewed database recovery plan; do not reset or delete the production database as a quick fix.

Record the deployed Git commit, Supabase project reference, migration version, deploy time, and test results so the next release starts from a known state.
