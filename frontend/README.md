# Roup frontend

React 19 and Vite application. From this directory, run `npm install`, then `npm run dev` for local development or `npm run build` for a production bundle.

The frontend reads active secondary markets and Dutch auctions from the backend through the Vite `/api` proxy. Set `VITE_API_BASE_URL` only when the API gateway is hosted at a different origin. Authentication uses `VITE_AUTH_API_BASE_URL` (empty by default for Vite's `/api` proxy). Orders, seller listings, and watchlists show an unavailable state because this repository does not yet provide persistent user-facing APIs for those features. Theme preference is stored locally; marketplace business records are not.
