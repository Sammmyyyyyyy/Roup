# Integration audit

## OAuth routes and flow

- `GET /oauth2/authorization/google` begins Spring Security's Google OAuth2 authorization code flow when configured.
- `GET /login/oauth2/code/google` is the Gateway callback URI and is forwarded to Auth-Svc.
- `POST /api/oauth/exchange` atomically consumes a hashed, short-lived code and returns the existing `UserResponseDto` session response.
- `GET /api/secondary-markets/active-markets` is public for the landing page's real market availability panel. Other protected marketplace routes still require the Roup JWT.

OAuth server sessions are enabled only as needed (`IF_REQUIRED`) so Spring can validate OAuth state; regular API authorization continues to use the existing JWT filter/resource server. OAuth remains disabled unless `GOOGLE_OAUTH_ENABLED=true` and provider credentials are supplied. Google provider round-trip requires developer-owned credentials and was not performed as part of local build verification.

## Data and UI

Landing-page activity reads active markets from the connected API and renders loading, unavailable, or empty states when there is no data. No sample prices, listings, or orders are used there. The signup and login pages share the same OAuth initiation function and preserve only validated local return paths. The callback uses the existing `roup-auth-session` contract.

Orders, seller listings, and watchlists continue to show unavailable/empty states where the repository has no persistent API integration. This audit does not treat frontend illustration art or the intentional zero-balance account defaults as marketplace activity.
