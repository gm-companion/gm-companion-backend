const express = require('express');

const router = express.Router();
const querystring = require('querystring');
const tiny = require('tiny-json-http');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.SERVER_URL}/spotify/callback`;
const SCOPE = 'user-library-read playlist-read-private streaming user-modify-playback-state user-read-currently-playing user-read-playback-state';

console.log(CLIENT_ID);
console.log(CLIENT_SECRET);
console.log(REDIRECT_URI);
console.log(process.env.SERVER_URL);

let lastRedirectUri = '';

/**
 * Callback after user logged in
 */
router.get('/callback', (req, res) => {
  const { code, error } = req.query;

  if (error === 'access_denied') {
    res.render('access-denied', { service: 'Spotify' });
    return;
  }

  if (!code) {
    res.sendStatus(500);
    return;
  }

  const query = querystring.stringify({
    code
  });

  const url = `${lastRedirectUri}?${query}`;
  res.redirect(url);
});

/**
 * Authorize
 */
router.get('/login', (req, res) => {
  lastRedirectUri = req.query.redirect_uri;

  if (!lastRedirectUri) {
    console.log('No redirect uri was given');
    res.sendStatus(400);
    return;
  }

  const query = querystring.stringify({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: encodeURIComponent(SCOPE)
  });

  const url = `https://accounts.spotify.com/authorize?${query}`;

  console.log(url);

  res.redirect(url);
});

/**
 * Get the initial access token
 */
router.get('/token', async (req, res) => {
  const { code } = req.query;

  console.log(code);
  console.log(REDIRECT_URI);

  if (!code) {
    res.sendStatus(400);
    return;
  }

  if (!REDIRECT_URI) {
    res.sendStatus(500);
    return;
  }

  try {
    const reply = await tiny.post({
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }
    });

    res.json(reply.body);
  } catch (err) {
    console.error('Error!', err);
    res.sendStatus(500);
  }
});

/**
 * Refresh the access token
 */
router.get('/refresh', async (req, res) => {
  console.log(req.query);

  const { refresh_token: refreshToken } = req.query;

  if (!refreshToken) {
    console.error('Error: No refresh token given!');
    res.sendStatus(400);
    return;
  }

  try {
    const reply = await tiny.post({
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
      },
      data: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }
    });


    res.json(reply.body);
  } catch (err) {
    // If refresh is invalid
    // Could be that the user revoked permission
    if (err.body.error) {
      console.log('Error: Could not refresh token. Maybe permission was revoked?');

      const reply = {
        error: err.body.error
      };

      res.json(reply);
    } else {
      console.error('Error!', err);
      res.sendStatus(500);
    }
  }
});


module.exports = router;
