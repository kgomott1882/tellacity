# Fixing "Your connection is not private" (NET::ERR_CERT_COMMON_NAME_INVALID)

If users see **"Your connection is not private"** with `NET::ERR_CERT_COMMON_NAME_INVALID` when visiting **https://tellacity.com**, the browser is rejecting the site **before** any request reaches the app. This is an **SSL/TLS certificate and domain configuration** issue on your hosting, not in the app code.

## What’s going wrong

- The certificate is valid for one host (e.g. `www.tellacity.com`) but the user is visiting the other (e.g. `tellacity.com`), or the cert doesn’t cover the host they’re using.
- The app already redirects **www → non-www** in `next.config.js`, so once the certificate is correct, everyone will land on one canonical URL.

## What you must fix (hosting / DNS)

Do this where you host **tellacity.com** (e.g. Vercel, Cloudflare, or your server).

### Option A: Host supports both domain and www (recommended)

1. **Add both domains** in the host’s dashboard:
   - `tellacity.com`
   - `www.tellacity.com`
2. **Let the host issue certificates for both** (e.g. via Let’s Encrypt or the provider’s SSL).
3. **DNS:**  
   - Root: A/AAAA or CNAME to your host (as they instruct).  
   - `www`: CNAME to the host’s target (e.g. `cname.vercel-dns.com` or similar).

Result:  
- `https://tellacity.com` and `https://www.tellacity.com` both get a valid cert.  
- The app then redirects `www` → `https://tellacity.com` (see `next.config.js`).

### Option B: Vercel

1. **Project → Settings → Domains**
2. Add **tellacity.com** (root) and **www.tellacity.com**.
3. Follow Vercel’s DNS instructions for both (A/CNAME for root, CNAME for www).
4. Wait for Vercel to provision certificates for both (usually automatic).
5. Optionally set **tellacity.com** as primary so links use that.

After that, the app redirect will send `www` traffic to `https://tellacity.com`.

### Option C: Cloudflare

1. Add the site and ensure DNS is proxied (orange cloud) for both:
   - `tellacity.com` (A or CNAME to your origin)
   - `www.tellacity.com` (CNAME to your origin or to `tellacity.com`)
2. **SSL/TLS**:
   - Mode **Full** or **Full (strict)**.
   - Ensure the origin server has a valid cert, or use Cloudflare’s origin cert.
3. **Page Rules or Redirect Rules** (optional):  
   Redirect `http://tellacity.com/*` and `http://www.tellacity.com/*` to `https://tellacity.com/:splat` so everything is HTTPS and non-www.

## What the app already does

- **Redirect www → non-www:**  
  In `next.config.js`, requests to `www.tellacity.com` are redirected to `https://tellacity.com` (same path). So once the certificate is valid for the host the user hits, they end up on one canonical URL.

## Checklist

- [ ] Both `tellacity.com` and `www.tellacity.com` are added in the host’s domain settings.
- [ ] DNS for both points to the same host and certificates are issued for both (or only one is used and the other redirects at the edge).
- [ ] No custom/self-signed cert that doesn’t match the domain.
- [ ] After DNS/cert propagation (can take a few minutes), test:
  - https://tellacity.com
  - https://www.tellacity.com (should redirect to https://tellacity.com)

After the certificate and DNS are correct, users will no longer see "Your connection is not private" for these URLs.
