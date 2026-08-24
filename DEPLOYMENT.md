# Store deployment

The Store calls Atlas only from server code. Configure these variables separately for Preview and Production:

- `STORE_ENABLED`
- `ATLAS_API_URL`
- `ATLAS_STOREFRONT_API_KEY`
- `ATLAS_VERCEL_BYPASS_SECRET` (Preview only when Dashboard Preview is protected by Vercel Authentication)
- `AUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`

Preview must point to the Dashboard staging deployment. Production must point to `https://dashboard.laheeb.coffee`. Preview and Production API keys and auth secrets must be different.

When Dashboard Preview uses Vercel Authentication, configure `ATLAS_VERCEL_BYPASS_SECRET` on the Store Preview with the Dashboard project's automation bypass secret. It is sent only by the Store server as `x-vercel-protection-bypass`; do not prefix it with `NEXT_PUBLIC_` and do not configure it in Production unless the Production Atlas URL is protected.

Do not add Wayl or Vercel Blob credentials to this project. Atlas owns payment and media operations. After changing environment variables, redeploy without build cache so `NEXT_PUBLIC_SITE_URL` is rebuilt correctly.
