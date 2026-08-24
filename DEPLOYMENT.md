# Store deployment

The Store calls Atlas only from server code. Configure these variables separately for Preview and Production:

- `STORE_ENABLED`
- `ATLAS_API_URL`
- `ATLAS_STOREFRONT_API_KEY`
- `AUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`

Preview must point to the Dashboard staging deployment. Production must point to `https://dashboard.laheeb.coffee`. Preview and Production API keys and auth secrets must be different.

Do not add Wayl or Vercel Blob credentials to this project. Atlas owns payment and media operations. After changing environment variables, redeploy without build cache so `NEXT_PUBLIC_SITE_URL` is rebuilt correctly.
