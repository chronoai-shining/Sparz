# Sparz deployment

## Application

- Repository: `https://github.com/chronoai-shining/Sparz` (public).
- ChronoCD project: `sparz`.
- ChronoCD app: `sparz`.
- Service: `sparz-web`, port `8080`.
- Assigned endpoint: `https://sparz-c1ddd1707b.apps.nyxid.ai`.
- Health endpoint: `/health`.
- Initial deployment applied: October 27, 2026, 09:43:04 UTC.
- Initial generation and revision: `1`.
- Configuration: `deploy/chrono-cd.json`.

An assigned endpoint and a healthy container do not by themselves establish public availability. Check the status route and confirm `phase: ready` and `route.serving: true`, then request the public homepage and `/health` before reporting the website live.

## Immutable build

Website source commit:

```text
9e333fea48e7b2638e51590055d47c03acfeff34
```

Container image:

```text
ghcr.io/chronoai-shining/sparz@sha256:4df525fa9b4c30a7bd30df1738d3f1b567a02e5102d1f91df5f318ec6a45ac23
```

The build and all 20 browser tests passed in GitHub Actions run `40480365235`. Documentation-only commits after the source commit do not change this image. Future website changes need a new successful image build and an explicit ChronoCD deployment; publishing to GitHub alone does not update the live application.

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
