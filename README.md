# Open Router

A self-hosted LLM gateway. Sign up, generate an API key, and call one standardized `/chat` endpoint against any model in the catalog — the gateway resolves the right provider, deducts credits, and logs the conversation.

## Architecture

```
server/
  db/               @repo/db — Prisma schema, migrations, generated client, seed data
  primary-backend/  auth, api keys, credits, catalog, conversation history (port 3000)
  api-backend/      the completions gateway itself (port 3001)
```

Both backends are separate Express services sharing one Postgres database through `@repo/db`. `primary-backend` is what a dashboard talks to — signup/login, managing API keys, buying credits, browsing the model catalog, reading past conversations. `api-backend` is what your own applications call to actually run a completion. They don't call each other directly.

## Running locally

```
cd server
npm install
npm run dev --workspace=primary-backend   # port 3000
npm run dev --workspace=api-backend       # port 3001
```

Each package reads its own `.env` (already gitignored — set these yourself, nothing here reads or writes them):

**`server/db/.env`**
- `DATABASE_URL` — Postgres connection string, shared by both backends

**`server/primary-backend/.env`**
- `DATABASE_URL`
- `PORT` (defaults to 3000)
- `NODE_ENV`
- `JWT_SECRET` — signs the session cookie; must match `api-backend`'s value

**`server/api-backend/.env`**
- `DATABASE_URL`
- `PORT` (defaults to 3001)
- `NODE_ENV`
- `JWT_SECRET` — must match `primary-backend`'s value
- `OPENAI_API_KEY`
- `GROQ_API_KEY`

On every `primary-backend` boot, `seedPricing` and `seedNewModels` (from `@repo/db/seed`) run automatically. They're idempotent — safe to run on every deploy. `seedPricing` corrects known models' per-token pricing to real, current values; `seedNewModels` adds any catalog rows that don't exist yet (currently just the Groq-hosted `openai/gpt-oss-120b`). Neither of them touches rows they don't recognize by slug — anything you've added by hand stays untouched.

## Auth model

There are two layers, and both are required to call the completions endpoint:

1. **Session (JWT cookie)** — `POST /auth/signup` or `POST /auth/login` on `primary-backend` sets an httpOnly `token` cookie, valid 4 days. This proves *who you are*. Every authenticated route on both backends reads this cookie.
2. **API key (Bearer header)** — `POST /api` on `primary-backend` (while authenticated) creates a new key and returns the raw value once. Every request to `api-backend`'s `/api/completions/chat` must also include `Authorization: Bearer <apiKey>`. This proves *which key is being billed* — the key must belong to the same user as the session cookie, and must not be disabled or deleted.

In short: the cookie says who's calling, the header says what to charge.

## The completions endpoint

```
POST http://localhost:3001/api/completions/chat
Cookie: token=<jwt>
Authorization: Bearer <apiKey>
Content-Type: application/json
```

### Request

```json
{
  "model": "openai/gpt-6-astra",
  "messages": [
    { "role": "user", "content": "hello" }
  ]
}
```

- `model` — a model's `slug` from the catalog (see `GET /model` on `primary-backend`).
- `messages` — at least one message. `role` is one of `user`, `assistant`, `system`, `developer`.

### Response — 200

```json
{
  "output": "hi, how can I help?",
  "total_tokens": 42,
  "total_credit_cost": 340
}
```

- `output` — the model's reply text.
- `total_tokens` — input + output tokens for this request.
- `total_credit_cost` — credits deducted from your account for this request.

### Errors

Every error response from `api-backend` (including `/api/completions/chat`) is `{ "msg": "..." }` — a flat object, no error codes beyond the HTTP status.

| Status | Meaning |
|---|---|
| 400 | Invalid request body, or the model exists but isn't backed by a supported provider yet |
| 401 | Missing/invalid session cookie, missing/malformed `Authorization` header, or the API key doesn't belong to this user / is disabled or deleted |
| 402 | Not enough credits to cover this request |
| 404 | Model slug doesn't exist in the catalog, or the user/key lookup failed |
| 500 | Something broke calling the provider, or an unexpected server error |

`primary-backend`'s endpoints aren't fully consistent yet — most use `{ "msg": "..." }` too, but `apiController.ts`, `companyController.ts`, `modelController.ts`, and `modelProviderMappingController.ts` currently return `{ "message": "..." }` instead. Worth normalizing at some point; not touched here since it's outside what this pass was scoped to change.

## Credits and pricing

1 credit = $0.000001 (a millionth of a dollar). Every `ModelProviderMapping` row has an `inputTokenCost` and `outputTokenCost`, in credits per single token, set to that model's real published price rounded to the nearest whole credit. This means very cheap models (sub-$1/1M tokens) can round down to 0 or 1 credit/token — a known tradeoff of keeping costs as plain integers instead of decimals.

Cost for a request is `input_tokens * inputTokenCost + output_tokens * outputTokenCost`, deducted from `User.credits` and added to the API key's `creditsConsumed` in the same transaction that logs the `Conversation` row. If the account doesn't have enough credits, the request is rejected before the provider is ever called.

New users start with 1000 credits. `POST /payments/add-credit` on `primary-backend` tops up an account — right now it trusts the request body directly (`{ "amount": 1000 }`) and marks the transaction `completed` immediately. There's no real payment gateway wired in yet; that's a stub to build on, not a finished flow.

## Adding a new provider

The gateway resolves which SDK to call by the model's **Company** name (`OpenAi`, `Anthropic`, `Google`, `Groq`, ...) — not the hosting `Provider`. A `Company` is who made the model; a `Provider` is who's serving it (Azure, Bedrock, Groq's own infra, etc.). To add support for a new company's models:

1. Write a service function in `server/api-backend/src/service/` matching the shape every provider already follows:
   ```ts
   export const yourService = async (request: AiRequest): Promise<AiResponse> => { ... }
   ```
   `AiRequest`/`AiResponse` are in `server/api-backend/src/types/index.ts`. Build the SDK client *inside* the function, not at module load — a provider whose SDK throws on a missing API key should only break requests to that provider, not crash the whole server.
2. Register it in `server/api-backend/src/service/providerRegistry.ts`:
   ```ts
   const registry: Record<string, ProviderService> = {
       "OpenAi": openAiService,
       "Groq": groqService,
       "YourCompany": yourService,
   };
   ```
3. Add the model to the catalog — either by hand or via `server/db/seed.ts` — with a `Company` row matching the registry key exactly, and a `ModelProviderMapping` with real per-token pricing (see Credits and pricing above).
4. Add the new SDK's API key env var name to this README and to `server/api-backend/.env` yourself (nothing in this codebase reads or writes `.env` files for you).

That's the whole surface. `completionsController.ts` never needs to change.
