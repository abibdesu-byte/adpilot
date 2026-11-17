# AdPilot

Initial call-focused media buying workspace. Meta Ads, Google Ads, and SEO have separate views and reports. No landing-page builder is included.

## Working features

- Client profiles with service, location, phone number, and reporting currency.
- Template ad drafts, preview, draft library, and text export.
- Separate channel dashboards and reports, date filters, daily charts, CSV import and export.
- Missing call counts remain unknown; clicks are never counted as calls. Cost per call uses reported calls. SEO position is impression-weighted.
- Template keyword ideas with clearly unavailable search volume and CPC.
- AI chat and ad generation through a server-side OpenAI Responses API integration, when configured.
- Password gate, provider timeout, request-size cap, and basic AI request throttling.
- Explicitly labeled sample data; real client work starts empty.

## Not implemented yet

One-click Meta/Google OAuth, live reporting, Search Console sync, real keyword pricing/volume, call-tracking integration, image generation, ad publishing, background schedules, automatic optimizations, and multi-user database storage. No platform action or advertising spend is performed by this version. AI cannot perform actions or fetch external data.

Client profiles, CSV data, and drafts stay in the browser's localStorage. There is no cross-device sync. JSON backup export is included; backup restore is not yet implemented. Export important work before clearing browser storage. This is an initial private workspace, not a production multi-tenant agency service.

## Local run

Requires Node.js 22 or newer. There are no external dependencies. Set environment variables before starting:

```powershell
$env:APP_USERNAME = 'admin'
# Set APP_PASSWORD privately in your shell or hosting secret manager.
npm start
```

The server refuses workspace access until APP_PASSWORD is configured. Visit http://localhost:3000 and use HTTP Basic sign-in. Keep public hosting on HTTPS.

Optional AI configuration: set OPENAI_API_KEY on the server. OPENAI_MODEL defaults to gpt-4.1-mini and can be changed to a model available to your API account. The API has separate billing. AI requests send the selected client's brief, aggregate metrics, and limited chat context to the provider. No API keys are stored in browser data. Live provider calls have not been tested without a real key.

## Render deployment

Push this directory as the root of a NEW GitHub repository. Do not use the unrelated existing Render service repositories.

Create a new Render Web Service:

- Repository: the new AdPilot repository
- Runtime: Node
- Build command: `npm run check`
- Start command: `npm start`
- Instance: Free
- Region: Singapore
- Health check: `/health`
- Environment: `APP_USERNAME=admin`; set a private, strong `APP_PASSWORD` in Render. Optionally add `OPENAI_API_KEY` and `OPENAI_MODEL`.

Use a distinct service name such as `adpilot-calls` (availability determines the final onrender.com URL). No Render service has been created by this package. Source repository creation and deployment are pending.

Render Free sleeps after 15 idle minutes and has an ephemeral filesystem. This app does not write user records to the server filesystem. Reliable unattended automation needs durable storage and an external scheduler or appropriate always-running infrastructure; this initial version runs no background jobs.

## CSV import

Required header:

```csv
date,channel,campaign,impressions,clicks,spend,calls,qualified_calls,position
```

One row per date/channel/campaign. Channels: `meta`, `google`, `seo`. Dates: YYYY-MM-DD. Use blank for unknown metrics. Use a keyword or page name in `campaign` for SEO. SEO spend must be zero or blank. Position is SEO-only. Import replaces rows with matching date/channel/campaign for the selected client. All values use the client's currency; no conversion is performed. Downloaded sample reports must not be imported as real performance.

## Verification

`npm run check` checks JavaScript syntax. `npm test` checks CSV parsing, calculations, authentication, HTTP assets, and AI response handling using a stub provider. Browser visual QA, live ad integrations, and live AI billing are not verified by these tests.

References: https://render.com/docs/free and https://developers.openai.com/api/reference/resources/responses/methods/create

## In-app connections (update)

Open Connections, select a real client, and enter provider credentials. No manual Render configuration is needed for these per-client connections. OpenAI verification checks the selected model; Meta verifies an ad account; Google Ads verifies the selected customer; Search Console verifies a property; DataForSEO verifies API account credentials. These checks do not enable report sync, paid keyword requests, or publishing. Google tokens are supplied manually; OAuth consent redirects and refresh are not implemented. Tokens may expire and must be replaced in-app.

Credentials are encrypted with AES-256-GCM using a server key derived from APP_PASSWORD, held in Secure HttpOnly SameSite=Strict cookies, and excluded from localStorage, backups, and API responses. They survive server restarts for 30 days in the same browser. Clearing cookies or changing APP_PASSWORD disconnects them. This browser-bound design avoids Render Free ephemeral disk loss but is not a shared agency credential vault. Existing server-level OPENAI_API_KEY remains a fallback after deleting a browser connection.

The Automation tab stores reusable AI instructions and lets the user run them explicitly. Each run uses the selected client's brief and metrics, incurs normal AI API usage, and saves its text result locally. It does not create schedules or publish ads.
