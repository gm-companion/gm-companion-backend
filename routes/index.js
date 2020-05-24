const express = require('express');

const Spotify = require('../spotify/spotify');
const print = require('../util/print');
const packagejson = require('../package.json');

const router = express.Router();
const { SERVER_URL } = process.env;

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', {
    title: 'gm-companion',
    version: packagejson.version,
    url: SERVER_URL,
    spotify: new Spotify(false),
    discord: {
      token: print.secret(process.env.DISCORD_BOT_TOKEN),
      clientId: process.env.DISCORD_BOT_CLIENT_ID
    }
  });
});

module.exports = router;
