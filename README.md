# the lilgriper

Personal site for **the lilgriper**, published from `main` with GitHub Pages.

The custom domain in `CNAME` is `lilgrip.com`.

`lilgrip.com` DNS is still on Squarespace, and mail stays on Titan. Change only the website records. Leave the nameservers, MX, SPF, and DMARC records alone.

In Squarespace DNS for `lilgrip.com`:

- Replace the Squarespace `A` records on `@` with `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`.
- Point the `www` `CNAME` at `j-v-studios.github.io` instead of `ext-sq.squarespace.com`.
- Remove the Squarespace `HTTPS` record on `@` if it is still pinning the old addresses.

Notes are stored in Supabase so anyone who opens the site can read them.
