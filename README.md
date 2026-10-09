# ScamBuster

A free scam checker anyone can use from a phone or computer. Paste a text message, email, repair quote, link, phone number, name, or business, and ScamBuster flags the warning signs used in common scams.

- **No API keys, no accounts, no server.** All analysis runs in the browser, so nothing you paste is uploaded.
- **Unlimited scans.**
- **Works offline and installs like an app** (Add to Home Screen on iPhone/Android, or Install in Chrome/Edge).

## What it checks

Untraceable payment demands (gift cards, wire, crypto, Zelle/Cash App), upfront fees, requests for passwords/SSN/codes, threats and false urgency, impersonation of agencies, banks, and big companies, remote-access/tech-support tricks, prize/lottery and investment scams, family-emergency ("Hi mom") scams, secrecy requests, job/overpayment scams, fake "fund recovery" services, mobile mechanic and contractor red flags, and suspicious links (look-alike brand domains, shorteners, risky domain endings, raw IPs, punycode).

For any names, businesses, phone numbers, emails, or websites it finds, it gives one-tap links to check reputation (BBB, Google Safe Browsing, ScamAdviser, WHOIS, Ripoff Report, Reddit, and scam-report searches).

The detection rules live in `src/services/scamEngine.ts`. Add new patterns there.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in dist/
npm run lint     # type check
```

## Publish for free (GitHub Pages)

The workflow in `.github/workflows/deploy.yml` builds and publishes the site on every push to `main`.

One-time setup: in the GitHub repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. The app will then be live at `https://<your-username>.github.io/<repo-name>/`.

`dist/` is a plain static site, so it can also be hosted on Netlify, Cloudflare Pages, or any web host.
