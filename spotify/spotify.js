const SpotifyWebApi = require('spotify-web-api-node');
const pe = require('pretty-error').start();
const print = require('../util/print');

class Spotify {
  constructor(authenticate = true) {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = `${process.env.SERVER_URL}/spotify/callback`;
    this.scope = 'user-library-read playlist-read-private streaming user-modify-playback-state user-read-currently-playing user-read-playback-state';

    if (this.clientId) {
      console.log(`Spotify Client ID: ${this.clientId}`);
    } else {
      console.log('No spotify client id set.');
    }

    if (this.clientSecret) {
      console.log(`Spotify Client Secret: ${print.secret(this.clientSecret)}`);
    } else {
      console.log('No spotify client secret set.');
    }

    console.log(`Spotify Redirect URI: ${this.redirectUri}\n`);

    if (authenticate && this.clientSecret && this.clientId && this.redirectUri) {
      this.api = new SpotifyWebApi({
        clientId: this.clientId,
        clientSecret: this.clientSecret
      });

      this.api.clientCredentialsGrant()
        .then((data) => {
          this.api.setAccessToken(data.body.access_token);
        })
        .catch((error) => {
          console.error(pe.render(error));
          this.api = undefined;
        });
    }
  }

  secret() {
    return print.secret(this.clientSecret);
  }
}

module.exports = Spotify;
