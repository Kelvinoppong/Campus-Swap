<div align="center">

# Campus Swap

**A student-only marketplace for iOS — verified `.edu` sign-in, campus meetups, and tickets from the student section to conferences abroad.**

[![iOS](https://img.shields.io/badge/iOS-Expo%20SDK%2057-000?logo=apple&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0%20strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)

</div>

---

<div align="center">

<img src="docs/screenshots/sign-in.png" width="200" alt="Sign-in screen" />
<img src="docs/screenshots/feed.png" width="200" alt="Home feed" />
<img src="docs/screenshots/listing-ticket.png" width="200" alt="Conference ticket listing" />
<img src="docs/screenshots/sell.png" width="200" alt="Create listing flow" />

<img src="docs/screenshots/verify.png" width="200" alt="One-time code verification" />
<img src="docs/screenshots/listing-console.png" width="200" alt="Console listing" />
<img src="docs/screenshots/inbox.png" width="200" alt="Messages inbox" />
<img src="docs/screenshots/profile.png" width="200" alt="Seller profile" />

<sub>Running on an iPhone 16 Pro Max simulator</sub>

</div>

---

## The problem

Students sell to each other constantly — a console at the end of term, a jacket,
a conference pass they can no longer use — and the options are all bad. Facebook
Marketplace means meeting strangers off campus. Class group chats bury listings
in minutes. Craigslist is Craigslist.

Campus Swap makes the campus itself the trust boundary. You can only join with a
verified `.edu` address, every seller shows a rating and sale count, and handoffs
default to named public spots like the student union lobby.

## What it does

Sign in with a school email and a six-digit code — no passwords to leak or
reset. Browse anything students actually trade across ten categories, from
textbooks and consoles to clothing, bikes and beauty. List an item in a single
screen that adapts to what you're selling: clothing asks for size and fit,
tickets ask for the event, venue and transfer method. Message a seller and agree
on a meetup spot.

Tickets get first-class treatment because they don't behave like physical goods.
A dorm lamp is a campus handoff; a three-day conference pass in Berlin is a
digital transfer to someone who will never meet you. Both are listings, and the
model handles the difference rather than pretending it doesn't exist.

## Finding things by describing them

Marketplace search normally fails the moment a seller types a bad title. A
listing called "winter stuff — must go" is invisible to anyone searching for a
coat, and no amount of keyword tuning fixes a word that was never written down.

So search here runs on the photos instead. Every listing image is passed through
[CLIP](https://openai.com/research/clip), which turns it into a 512-dimensional
vector. The useful property of CLIP is that it embeds *text into the same space*,
so a typed phrase can be compared directly against photographs — and the match
is on what the picture shows, not on what the seller called it.

![Visual search results: six plain-English queries, each matched to the correct listing photo](docs/screenshots/visual-search.png)

Those are real results from the model, reproducible with
`npm run demo:visual-search --workspace @campus-swap/api`. The last two rows are
the ones worth dwelling on: *"something to wear on my feet"* finds the sneakers
and *"a musical instrument"* finds the guitar, with no word in either query
appearing anywhere in the listing.

The same index powers "more like this" on a listing, which is the same
nearest-neighbour query starting from a photo's vector rather than a sentence's.

Vectors live in Postgres through `pgvector`, indexed with HNSW for approximate
nearest-neighbour lookup, which keeps the feature inside the database that
already holds the listings rather than adding a separate vector store to operate.
Photos are embedded individually and rolled up to one row per listing, so an item
matches on its *best* photo — the back of a jacket should still match a search
for that jacket.

Two deliberate constraints are worth naming. Embeddings are L2-normalised on
write, which is what makes pgvector's cosine operator a valid ranking. And CLIP
scores are not calibrated between queries — 0.31 in one search means nothing in
another — so results are ranked and capped rather than cut at a fixed threshold,
and the score is never shown to users as a confidence percentage.

## Engineering worth looking at

**Authentication is the part I'd most want to be asked about.** Sign-in codes are
only about twenty bits of entropy, so the system is built assuming the database
will leak. Codes are never stored in the clear — they're HMAC-SHA256 hashed with
a pepper held in the environment, so a stolen dump alone can't be brute-forced
offline. Comparison uses `timingSafeEqual`. Each code allows five attempts before
it dies, with separate hourly rate limits per email address and per IP so one
address can't be farmed and one host can't spray many addresses.

Refresh tokens rotate on every use and are grouped into a family per device.
Presenting a token that was already rotated is a strong signal that someone is
replaying a stolen credential, so the entire family is revoked — logging out both
the attacker and the real user rather than silently letting the theft continue.
Requesting a code returns an identical response whether or not the account
exists, so the endpoint can't be used to enumerate which students have signed up.

**One schema, two consumers.** Validation rules live in a shared package of Zod
schemas that both the app and the API import. A rule like "a meetup listing must
name a meetup spot" or "a ticket listing must carry an event" is written once and
enforced on both sides, so the client can't drift from the server.

**Modelling decisions that buy future flexibility.** Money is stored as integer
cents everywhere, because floats and prices don't mix. A `deliveryMethod` field
separates how an item changes hands from what it is, which is what lets a campus
meetup and an international ticket transfer share one model. Category-specific
attributes live in a JSONB `details` column, so adding a new category is a
product decision rather than a database migration.

**Type safety taken seriously.** The whole monorepo runs TypeScript 6 in strict
mode with `noUncheckedIndexedAccess`, and ESLint bans `any` outright. One
deliberate exception: `consistent-type-imports` is disabled for the API, because
"fixing" those imports would erase the decorator metadata NestJS relies on and
silently break dependency injection at runtime.

## Built with

| Layer | Choices |
| --- | --- |
| iOS app | Expo SDK 57, React Native 0.86, Expo Router, Reanimated, TanStack Query, Zustand |
| API | NestJS 11, Prisma, PostgreSQL, JWT access + refresh rotation, Zod validation |
| Visual search | CLIP (ViT-B/32) run locally via Transformers.js and ONNX, pgvector with an HNSW index |
| Shared | TypeScript 6 strict, Zod schemas consumed by both sides |
| Tooling | npm workspaces, ESLint 9 flat config, Prettier, Jest, GitHub Actions |

Continuous integration runs linting, type-checking and the test suite, then
separately spins up Postgres to apply migrations and fail the build if
`schema.prisma` has drifted from the migration history.

## Running it

```bash
cd campus-swap
npm install
npm run dev:mobile      # Metro; press i for the iOS Simulator
```

The API additionally needs Postgres:

```bash
cp apps/api/.env.example apps/api/.env   # fill in the three secrets
npm run db:up                            # Postgres + Redis via Docker
npm run prisma:migrate --workspace @campus-swap/api
npm run dev:api
```

Verify everything with `npm run lint`, `npm run typecheck` and `npm test`.

## Project status

This is an in-progress portfolio project, and it's worth being precise about
where the line currently sits.

The iOS app is built and running: sign-in, code verification, feed, listing
detail, the create-listing flow, inbox, chat and profile. It currently renders
from a demo dataset, so the screenshots above are the real app rather than
mockups, but the listing screens are not yet reading from the API.

On the backend, authentication and listings are implemented, with 36 unit tests
covering code hashing, attempt limits, rate limiting, refresh-token reuse
detection and the discovery queries. The Prisma schema models the full domain
across twelve tables, including listings, photos, saved items, conversations,
messages, reviews, reports and blocks.

Visual search is split across that line. The model half is finished and verified
offline — the figure above is generated by running CLIP over the sample photos,
and it reproduces on any checkout. The retrieval half, the `pgvector` queries
behind `/listings/:id/similar` and `/discovery/search`, is written and unit
tested against a mocked database but has not yet been exercised against a live
Postgres instance.

Next up is wiring the app to the live API, then the messaging endpoints.
Deployment configuration for Vercel and Render is already in the repo.
