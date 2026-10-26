# Marketplace API status

Start the local Auth-Svc with `mvn '-Dspring-boot.run.profiles=local' spring-boot:run` from this directory. The local profile uses a file-backed H2 database at `data/roup-auth.mv.db` and creates the tables with Hibernate. The database directory is ignored by Git.

`ROUP_MAX_RESALE_MULTIPLIER` configures the maximum asking-price multiple of face value. The default is `1.2` (120%). The backend validates this on create and edit; the browser check is only a convenience.

All marketplace routes require the existing Roup bearer token:

- `GET /api/marketplace/listings`: active demo catalog and seller-submitted listings.
- `GET /api/marketplace/summary`: active market/listing counts. Completed trades are `null` because execution history is not implemented.
- `GET /api/markets` and `GET /api/markets/{id}`: listing-backed market views. Bid, spread, and last-trade data are not available.
- `GET /api/listings/mine`, `POST /api/listings`, `PUT /api/listings/{id}`, and `PATCH /api/listings/{id}/status`: authenticated seller listing management. Owners are resolved from the token and checked server-side. The listing request includes `authorizedToResell`; this is a seller attestation, not independent ticket or inventory verification.
- `GET /api/auctions` and `GET /api/orders`: return explicit `available: false` capability responses. No auction purchase, order matching, cancellation, payment, or settlement operation is exposed.

The `local` profile seeds six clearly flagged example catalog rows. Those rows cannot be edited as seller listings. Production must supply its database connection and schema management; the local H2 profile is not intended for deployment.
