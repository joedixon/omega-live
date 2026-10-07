# Omega Reverb

A page that shows you it's live. Everyone viewing it shares one room:

- **Presence:** who's here, as avatars that come and go.
- **Live cursors:** everyone's pointer, with their name.
- **Reactions:** emoji that float up on everyone's screen (or press 1–6).
- **Shoutouts:** messages saved by Laravel and broadcast to everyone, with your own round trip timed.
- **Stats:** open connections, read from Reverb's HTTP API.

It's a Laravel 13 app with Inertia and React, broadcasting through **Laravel Reverb rewritten in Rust**, the `laravel-omega-reverb` package, served by a Laravel Omega app on Laravel Cloud. The plan is to port it to Laravel Omega once `laravel::broadcast` lands; see [Porting to Laravel Omega](#porting-to-laravel-omega).

Visitors don't sign up. `EnsureGuestIdentity` gives each one a guest user, such as "Swift Otter", so they can join the presence channel.

## How it works

| Feature            | Path                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Presence           | Echo joins `presence-room`; `/broadcasting/auth` signs it with the visitor's name and color (`routes/channels.php`)              |
| Cursors, reactions | Whispers (`client-cursor`, `client-react`): browser to browser through Reverb, never touching PHP                                |
| Shoutouts          | `POST /shoutouts` saves it and dispatches `ShoutoutPosted`, broadcast now on `wall` through Reverb's HTTP API                    |
| Stats              | `ReverbStats` calls Reverb's `/connections` and `/channels/presence-room` through the Pusher SDK; the page polls every 5 seconds |

## Running locally

You need a Pusher-protocol server on `127.0.0.1:8080` with the app ID `omega`, key `omega-key` and secret `omega-secret`, as in `.env.example`. To use the Rust server, run it from any Laravel Omega app that registers `reverb::ReverbServiceProvider`, with those credentials in its `.env`:

```bash
cargo run -- reverb:start --host=127.0.0.1 --port=8080
```

Then, using Node 22 or later:

```bash
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite && php artisan migrate
npm install && npm run build
php artisan serve
```

Open the page in two browsers, or a normal and a private window, to see each other.

## Deploying to Laravel Cloud

Deploy it as a normal Laravel app. Its environment points the broadcaster and Echo at the Omega Reverb app:

```ini
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=…          # the Reverb app's REVERB_APP_ID
REVERB_APP_KEY=…
REVERB_APP_SECRET=…
REVERB_HOST=omega-reverb-production-dd2tio.laravel.cloud
REVERB_PORT=443
REVERB_SCHEME=https

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

- **Build time:** Vite reads the `VITE_` variables when `npm run build` runs, so set them before deploying.
- **Allowed origins:** if the Reverb app sets `REVERB_APP_ALLOWED_ORIGINS`, include this app's domain.
- **Database:** shoutouts and guests live in the database, so use a persistent one.
- **No queue worker:** `ShoutoutPosted` broadcasts immediately.

## Porting to Laravel Omega

The pieces map across like this:

| Laravel Classic                                          | Laravel Omega                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `resources/js` (Inertia + React)                         | Unchanged; the Omega skeleton uses Inertia and React too                                |
| `EnsureGuestIdentity` middleware                         | Middleware storing a guest in the session                                               |
| `Broadcast::channel('room', …)` and `/broadcasting/auth` | Needs `laravel::broadcast` channel authorization                                        |
| `ShoutoutPosted` / `ShouldBroadcastNow`                  | Needs `laravel::broadcast`; served with Reverb in the same app, it needn't go over HTTP |
| `ReverbStats` via the Pusher SDK                         | `Inject<reverb::Reverb>` and `reverb.connections(id)`, in-process                       |
| Shoutouts in Eloquent                                    | Whatever persistence Omega offers, or memory for a demo                                 |

Typed props on `live.tsx` (`me`, `shoutouts`, `stats`, `reverbHost`) are the contract to keep.
