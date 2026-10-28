# Google sign-in setup

Google sign-in uses Spring Security OAuth2 Login in Auth-Svc. It is optional: password sign-in and signup work with the default `GOOGLE_OAUTH_ENABLED=false` setting.

## Local setup

1. Create a Google OAuth client in Google Cloud Console. Configure the OAuth consent screen and add the accounts allowed to test it.
2. Create an OAuth client with the **Web application** type.
3. Add this exact authorized redirect URI:

   `http://localhost:8080/login/oauth2/code/google`

4. Set the following environment variables for Auth-Svc. Keep the client secret on the backend only:

   ```text
   GOOGLE_OAUTH_ENABLED=true
   GOOGLE_CLIENT_ID=<client id>
   GOOGLE_CLIENT_SECRET=<client secret>
   GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google
   FRONTEND_BASE_URL=http://localhost:5173
   ```

5. In `frontend/.env.local`, set:

   ```text
   VITE_GOOGLE_OAUTH_ENABLED=true
   VITE_AUTH_API_BASE_URL=
   ```

   The empty auth base uses Vite's `/api`, `/oauth2`, and OAuth callback proxies to the local gateway at `http://localhost:8080`. Restart Vite after changing environment variables.

## Production setup

Register the public Gateway callback URI in the Google client, for example `https://api.example.com/login/oauth2/code/google`. Configure `GOOGLE_OAUTH_REDIRECT_URI` to that exact URI and set `FRONTEND_BASE_URL` to the deployed Roup frontend origin (for example `https://app.example.com`). Set `VITE_GOOGLE_OAUTH_ENABLED=true` at frontend build time and set `VITE_AUTH_API_BASE_URL` to the Gateway origin when the frontend and API do not share the same origin. The frontend flag only controls UI availability; OAuth client credentials remain backend environment variables and must never use a `VITE_` prefix.

When Google OAuth is enabled without both backend credentials, Auth-Svc fails startup with a configuration error. Leave it disabled when credentials are unavailable.

## Sign-in flow

The browser starts at `/oauth2/authorization/google`. Auth-Svc validates Google's OAuth state through its server session, accepts only identities that provide a verified email, and reuses or creates the corresponding Roup user. It redirects to `/oauth-success` with a cryptographically random three-minute code. Auth-Svc persists only the code's SHA-256 hash. The frontend removes the code from browser history, then posts it to `/api/oauth/exchange`; an atomic database update permits a single successful redemption. The exchange response matches the existing signin profile/JWT response, and the frontend stores it through `authenticate()` in the existing session storage contract.

The `next` destination is saved in browser session storage after same-origin route validation. It is not accepted as an arbitrary backend redirect.
