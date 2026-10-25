# the lilgriper

Personal site for **the lilgriper**, served from this repo on GitHub Pages at [lilgrip.com](https://lilgrip.com).

## Pages

GitHub Pages publishes the root of `main`. The custom domain is `lilgrip.com` (`CNAME`).

The project URL before DNS is cut over:

`https://j-v-studios.github.io/grip-site/`

## Domain

`lilgrip.com` is on Squarespace DNS. Mail stays on Titan (`mx1.titan.email` / `mx2.titan.email`). Change only the website records. Leave the nameservers, MX, SPF, and DMARC records as they are.

In Squarespace → Domains → `lilgrip.com` → DNS:

1. Remove the four Squarespace `A` records on `@` (`198.185.159.144`, `198.185.159.145`, `198.49.23.144`, `198.49.23.145`).
2. Add these `A` records on `@`:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
3. Change the `www` `CNAME` from `ext-sq.squarespace.com` to `j-v-studios.github.io`.
4. Remove the Squarespace `HTTPS` record on `@` if it is still there. It pins browsers to the old Squarespace addresses.

After DNS propagates, enforce HTTPS in the repo’s Pages settings.
