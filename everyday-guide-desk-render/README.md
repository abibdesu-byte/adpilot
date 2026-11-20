# Everyday Guide Desk call landing pages

Buildless consumer pages published from `public/`. Run `node build.mjs` after changing the generated page content. Edit `public/assets/site.css` and `public/assets/site.js` directly.

Phone: +15755776846, provided by the user. Hours: 11 AM–8 PM EST, as provided. Operating days were not supplied, so no daily or weekday claim is displayed. EST is displayed literally; no automated daylight-saving assumption or live-open status is implemented.

Routes: `/`, `/name-change/`, `/wedding-officiants/`, `/privacy/`, `/service-information/`.

All call buttons use `tel:+15755776846`. A visitor initiates dialing with a click. There is no automatic redirect, lead form, fake account lookup, availability claim, booking promise, or government/provider affiliation.

The pages offer general information and explain service limitations. Optional life insurance introductions are disclosed separately, with permission required before a transfer. Existing insurance does not exclude an interested caller.

No third-party analytics, ad pixels, external fonts, storage, or cookies are installed by the application. `egd:call-click` is an in-memory custom DOM event only. A tap is not a connected-call conversion. Configure real call reporting and appropriate privacy notices before advertising.

Before campaign launch: supply/verify the actual legal operator and contact disclosures, confirm operating days and whether EST means fixed UTC-5 or U.S. Eastern time with daylight saving, confirm the desk can deliver the advertised information, review any help-service fees and referral compensation disclosures, and assess Google Ads government-document rules for the name-change campaign. The website does not claim ad approval.

Render: create a Static Site, deploy the dedicated source branch, use `node everyday-guide-desk-render/check.mjs` as the build command and `everyday-guide-desk-render/public` as the publish directory. Static hosting has no instance fee; workspace bandwidth/build allowances still apply.
