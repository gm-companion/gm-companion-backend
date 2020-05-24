const express = require('express');

const Spotify = require('../spotify/spotify');
const print = require('../util/print');

const router = express.Router();

console.log(`Server URL: ${process.env.SERVER_URL}\n`);

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', {
    title: 'gm-companion',
    url: process.env.SERVER_URL,
    spotify: new Spotify(false),
    discord: {
      token: print.secret(process.env.DISCORD_BOT_TOKEN)
    }
  });
});

module.exports = router;
