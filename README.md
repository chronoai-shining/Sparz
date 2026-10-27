# Sparz

A redesigned, bilingual company website for Sparz. Spacious typography, an original animated spark, restrained colors, clear service discovery, and responsive layouts replace the original dense presentation.

## Run locally

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

## Production and verification

```sh
npm run build
npm start
```

The production server listens on port 8080, configurable with `PORT`. `/health` returns an application health response. It serves only built assets, supports compression, sets security headers, and resolves the original service/contact URLs to the appropriate content. Unknown files return 404.

```sh
npx playwright install --with-deps chromium
npm test
```

Playwright uses one worker and runs desktop and mobile tests against the production server. Coverage includes source-content preservation, media, language persistence, service filters, keyboard-operated FAQs, testimonials, form validation, reduced motion, mobile navigation, narrow layouts, legacy URLs, and JavaScript-disabled access.

Validated on October 27, 2026: production build succeeds; all 20 desktop/mobile browser tests pass, including automated WCAG A/AA checks on expanded English and Chinese content. Automated checks are not a complete accessibility certification. Previews are saved in `docs/previews/`. Docker is not installed in this workspace, so the container build and deployment remain unverified until the GitHub workflow runs.

## Content and functionality

- All nine services and their descriptions/features; three case studies and results; three testimonials; four process steps; awards; partner links/logos; all five FAQs; company information; original English/Chinese translations.
- Original content and migration provenance are retained under `docs/`. Headlines and navigation labels are intentionally simplified, not literal reproductions.
- Fonts and original imagery are self-hosted. Animation uses CSS/SVG and honors both reduced-motion preferences and the pause control. No analytics or tracking scripts are added.
- The enquiry form prepares an email to `contactus@sparzmkt.com`. It **does not submit to a backend or claim delivery**. The original form only displayed a success alert without sending anything. Visitors can open their email app or copy their enquiry. Direct email and telephone links remain available without JavaScript; the form’s submit button stays disabled without JavaScript.

## Existing content issues

The source audit on October 27, 2026 found that every linked internal subpage returned 404. Service, about, work, and contact links now resolve to real sections. Links with no source content, including privacy, terms, careers, team, and editorial resources, open a clear availability notice and a contact action. Legal policies have not been invented.

The source displayed `+65 9341 3676` but linked to `+65 8039 8074`, and contained both `contactus@sparzmkt.com` and `hello@sparz.sg`. The displayed phone and company-domain email are primary; both alternate contact details remain accessible. Confirm these before a primary-domain cutover.

The source’s visible testimonial attribution (`Stefan Lin`; `Founder, GUNKEE Claypot Restaurant`) disagreed with its English translation attributes (`Biwei Lin`; `Owner`). The redesign uses the visible English attribution and preserves the original Chinese translations and complete source snapshot. Confirm the attribution with the company. Company-supplied growth and award claims are retained, not independently verified; results are not presented as guarantees.

## GitHub and ChronoCD

The repository `chronoai-shining/Sparz` was initially private and is now public at the owner's request. Source publication uses GitHub APIs with the observed parent commit and non-forced ref updates; existing local worktree metadata is preserved.

The existing GHCR container package remains private independently of the repository. Until private-registry credentials are configured, its owner must change the `sparz` package's visibility in GitHub's package settings before ChronoCD can pull it anonymously. GitHub warns that a public package cannot be made private again. Repository visibility alone did not resolve the deployment's `image_unauthorized` error.

`.github/workflows/publish.yml` tests changes and, on the repository’s default branch, publishes a non-root container to `ghcr.io/<owner>/sparz:<commit-sha>`. It uses GitHub’s job token; no stored third-party secret is needed for publishing. The job summary records the immutable image digest. The container build itself must be confirmed by a successful workflow or local Docker build before deployment.

`deploy/chrono-cd.example.json` is a template, not an applied deployment. Replace its image with the verified image digest, then apply through the authenticated NyxID CLI:

```sh
nyxid proxy request chrono-cd api/v1/account --output json
nyxid proxy request chrono-cd api/v1/projects/sparz/apps/sparz --output json
nyxid proxy request chrono-cd api/v1/projects/sparz/apps/sparz \
  --method PUT --data "$(cat /path/to/resolved-spec.json)" --output json
```

The product display name is **Sparz**; ChronoCD requires lowercase project/app identifiers, so both are `sparz`. Inspect existing app state before applying; a PUT replaces the complete spec. Use the observed generation with `If-Match` when updating an existing app. A private GHCR image may require the connected GitHub account’s package-read scope. Never paste registry credentials into files or chat.

Poll the app’s documented status endpoint and verify its returned public URL before calling deployment successful. The build workflow does not itself deploy to ChronoCD. No DNS or existing `sparzmkt.com` hosting change is implied.

## Layout

- `index.html`: server-rendered content and bilingual source copy.
- `src/styles.css`: visual system, responsive layouts, and motion.
- `src/main.js`: progressive enhancement and accessible interactions.
- `server.mjs`: dependency-free production static server.
- `public/`: self-hosted assets, font license, and favicon.
- `docs/`: original source, assets, route audit, and translation inventory.
- `tests/`: browser regression tests.
- `scripts/import-source.mjs`: one-time migration provenance; not used by the build and refuses to overwrite existing output.
