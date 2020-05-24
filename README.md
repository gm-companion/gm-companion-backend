# gm-companion-backend

A backend server for the [gm-companion](https://github.com/philinthegaps/gm-companion).

The server enables gm-companion users to authenticate with Spotify without having to create a developer account.  
It also serves as a Discord bot.

## Setup

### Install dependencies

Make sure you have the following dependencies installed:

* ffmpeg
* libopus

```
npm install
```

### Create `.env` file

```ini
SERVER_URL="enter the server url here (without trailing /)"

SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""

DISCORD_BOT_CLIENT_ID=""
DISCORD_BOT_TOKEN=""
```

### Start application

```
npm start
```

### Verify

Open your browser at http://localhost:3000/ or whatever your url is and verify that everything is set up correctly.