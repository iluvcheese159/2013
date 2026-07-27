# Bob + SearX-NG Setup (Render / Production)

This guide enables Bob to fetch live web results through SearX-NG in production.

## 1) Deploy a SearX-NG service

Use any host where your backend can reach it (Render, Fly, VM, etc.).

Important:
- Ensure the service is reachable from your backend runtime.
- Ensure SearX-NG allows JSON responses.
- Keep safe search enabled at the SearX-NG layer when possible.

## 2) Configure backend environment variables

Set these in your backend service environment:

- `SEARXNG_URL`
- `SEARXNG_ALLOWED_DOMAINS` (optional)

Examples:

```bash
SEARXNG_URL=https://your-searxng.example.com
SEARXNG_ALLOWED_DOMAINS=help.prusa3d.com,wiki.bambulab.com,all3dp.com,formlabs.com
```

Notes:
- `SEARXNG_URL` can be either:
  - a base URL (`https://your-searxng.example.com`), or
  - a full search endpoint (`https://your-searxng.example.com/search`).
- Bob normalizes base URLs by appending `/search` automatically.
- If `SEARXNG_ALLOWED_DOMAINS` is omitted, Bob falls back to built-in trusted domains.

## 3) Restart backend

After env changes, restart your backend service so Bob picks up the new configuration.

## 4) Validate quickly

Send a Bob question that requires live web context (non-platform general knowledge).

Expected behavior:
- Bob should still prioritize trusted Print Cosmos docs for platform questions.
- Bob should include externally retrieved context for general questions when available.
- If SearX-NG is unreachable, Bob should continue responding via LLM fallback.

## 5) Common failure modes

- `SEARXNG_URL` left as localhost in production.
- Service is private and unreachable from backend.
- Reverse proxy blocks query params or JSON format.
- Overly strict domain allowlist returns no usable results.
