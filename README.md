# gm-companion-backend

A backend server for the [gm-companion](https://github.com/philinthegaps/gm-companion).

The server enables gm-companion users to authenticate with Spotify without having to create a developer account.

## Setup

### Install dependencies

```sh
npm install
```

### Create `.env` file

```ini
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""

# optional sentry config
SENTRY_DSN=""
SENTRY_ENV=""
```

### Start application

```sh
npm run build
npm start
```

### Development

```sh
# run without transpiling, autodetects changes
npm run dev

# run tests
npm run test
```