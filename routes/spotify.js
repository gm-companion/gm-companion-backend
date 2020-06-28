const express = require('express');

const router = express.Router();
const querystring = require('querystring');
const tiny = require('tiny-json-http');
const pe = require('pretty-error').start();
const Spotify = require('../spotify/spotify');

const spotify = new Spotify(false);
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
    client_id: spotify.clientId,
    response_type: 'code',
    redirect_uri: spotify.redirectUri,
    scope: encodeURIComponent(spotify.scope)
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
  console.log(spotify.redirectUri);

  if (!code) {
    res.sendStatus(400);
    return;
  }

  if (!spotify.redirectUri) {
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
        redirect_uri: spotify.redirectUri,
        client_id: spotify.clientId,
        client_secret: spotify.clientSecret
      }
    });

    res.json(reply.body);
  } catch (err) {
    console.error(pe.render(err));
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
    console.error(pe.render('No refresh token given!'));
    res.sendStatus(400);
    return;
  }

  try {
    const reply = await tiny.post({
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${spotify.clientId}:${spotify.clientSecret}`).toString('base64')}`
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
      console.error(pe.render(err));
      res.sendStatus(500);
    }
  }
});

module.exports = router;
