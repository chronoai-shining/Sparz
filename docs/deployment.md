# Sparz deployment

## Application

- Repository: `https://github.com/chronoai-shining/Sparz` (public).
- ChronoCD project: `sparz`.
- ChronoCD app: `sparz`.
- Service: `sparz-web`, port `8080`.
- Live endpoint: `https://sparz-c1ddd1707b.apps.nyxid.ai`.
- Health endpoint: `/health`.
- Initial deployment applied: October 27, 2026, 09:43:04 UTC.
- Initial generation and revision: `1`.
- Latest deployment applied: October 27, 2026, 10:04:37 UTC.
- Current generation and revision: `2`.
- Configuration: `deploy/chrono-cd.json`.

An assigned endpoint and a healthy container do not by themselves establish public availability. Check the status route and confirm `phase: ready` and `route.serving: true`, then request the public homepage and `/health` before reporting the website live.

## Live verification

Verified after the final rollout on October 27, 2026:

- ChronoCD reports `phase: ready`, `route.serving: true`, and HTTP `200`.
- One updated, ready pod with zero restarts; generation/revision `2`.
- Public homepage and `/health` respond successfully; the new contrast color is present in the live CSS.
- Chromium smoke tests pass at 1440×1000 and 390×844 with no JavaScript errors and zero automated WCAG A/AA violations in the active-navigation state.
- Service filtering/expansion, all image requests, English/Chinese switching and persistence, FAQs, testimonial controls, mobile navigation, legacy service URLs, and horizontal-overflow checks pass.

These are point-in-time checks, not continuous monitoring or a complete accessibility certification.

## Immutable build

Website source commit:

```text
4f928b5717998155ddc9dad05c6d1480374bbdbd
```

Container image:

```text
ghcr.io/chronoai-shining/sparz@sha256:1f3b99fcb29f09ceea4a2400453479f181c9d7faf72b63290e1669f012d2dcec
```

The container build and all 20 browser tests passed in GitHub Actions run `40485343476`, including the active-navigation contrast regression check. The first attempt (`40484335426`) was canceled during a slow system-dependency download; the retry completed successfully. Documentation-only commits after the source commit do not change the image. Future website changes need a new successful image build and an explicit ChronoCD deployment; publishing to GitHub alone does not update the live application.

The owner made both the repository and the container package public. ChronoCD pulled this image without storing a registry credential. Repository visibility and package visibility are separate; the earlier private package was the cause of the resolved `image_unauthorized` failure.

## Operations

```sh
nyxid proxy request chrono-cd api/v1/projects/sparz/apps/sparz --output json
nyxid proxy request chrono-cd api/v1/projects/sparz/apps/sparz/status --output json
nyxid proxy request chrono-cd 'api/v1/projects/sparz/apps/sparz/logs?service=sparz-web&tail=100' --output json
```

Before updating, read the current app and its generation. Preserve the complete intended spec and use the observed generation with `If-Match`; a PUT replaces the spec. Deploy immutable image digests. Keep credentials out of source, logs, and chat.

## Scope and caveats

- No changes were made to the existing `sparzmkt.com` hosting or DNS.
- The enquiry form prepares an email; it does not send through a backend or claim delivery.
- Missing original pages are identified explicitly rather than replaced with invented content.
- The original source has contact-detail and testimonial-attribution discrepancies documented in `README.md`; confirm these before a primary-domain cutover.
- Automated accessibility checks are not a complete accessibility certification.
