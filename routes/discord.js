const express = require('express');
const fileUpload = require('express-fileupload');
const prettyBytes = require('pretty-bytes');
const DiscordBot = require('../discord/bot');

const router = express.Router();
const bot = new DiscordBot();

// Enable file upload middleware
router.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

/**
 * Info page
 */
router.get('/', (req, res) => {
  res.render('discord', {
    status: bot.status(),
    token: bot.token()
  });
});

/**
 * Get status information
 */
router.get('/status', (req, res) => {
  const response = {
    status: bot.status()
  };

  console.log(response);
  res.send(response);
});

/**
 * Redirect to the invite link
 */
router.get('/invite', (req, res) => {
  const clientId = process.env.DISCORD_BOT_CLIENT_ID;

  if (clientId) {
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=36756480`);
  } else {
    res.render('error', {
      message: 'Invite not possible.',
      error: {
        status: 'Discord client id is not set. Please contact the server owner.'
      }
    });
  }
});

/**
 * Resume audio playback in channel
 */
router.post('/:channelId/play', (req, res) => {
  const player = bot.player(req.params.channelId);
  if (player) player.play();
  res.sendStatus(200);
});

/**
 * Pause audio playback in channel
 */
router.post('/:channelId/pause', (req, res) => {
  const player = bot.player(req.params.channelId);
  if (player) player.pause();
  res.sendStatus(200);
});

/**
 * Set audio volume in channel (for music and/or sounds)
 */
router.post('/:channelId/volume', (req, res) => {
  const player = bot.player(req.params.channelId);
  if (player) {
    if (req.query.music) {
      player.setMusicVolume(req.query.music);
    }

    if (req.query.sounds) {
      player.setSoundVolume(req.query.sounds);
    }
  }

  res.sendStatus(200);
});

/**
 * Play music from url in channel
 */
router.post('/:channelId/play/music/url', (req, res) => {
  if (req.query.url) {
    console.log(`Play URL: ${req.query.url}`);

    const player = bot.player(req.params.channelId);
    if (player) {
      player.playUrl(req.query.url);
      res.sendStatus(200);
      return;
    }
  }

  res.sendStatus(400);
});

/**
 * Play music from data in channel
 */
router.post('/:channelId/play/music/data', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    console.log('No files were uploaded.');
  }

  const player = bot.player(req.params.channelId);
  if (player) {
    console.log(`Received music file: ${prettyBytes(req.files.data.size)}`);
    player.playFile(req.files.data.tempFilePath);
    res.sendStatus(200);
    return;
  }

  res.sendStatus(400);
});

/**
 * Play music from playlist data in channel
 */
router.post('/:channelId/play/music/playlist', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    console.log('No files were uploaded.');
  }

  const player = bot.player(req.params.channelId);
  if (player) {
    console.log(`Received music playlist file: ${prettyBytes(req.files.data.size)}`);
    player.playPlaylist(req.files.data.tempFilePath);
    res.sendStatus(200);
    return;
  }

  res.sendStatus(400);
});

/**
 * Play sounds from url in channel
 */
router.post('/:channelId/play/sound/url', (req, res) => {
  if (req.query.url) {
    console.log(`Play URL: ${req.query.url}`);

    const player = bot.player(req.params.channelId);
    if (player) {
      player.playUrl(req.query.url, req.query.url);
      res.sendStatus(200);
      return;
    }
  }

  res.sendStatus(400);
});

/**
 * Play sounds from data in channel
 */
router.post('/:channelId/play/sound/data', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    console.log('No files were uploaded.');
  }

  const player = bot.player(req.params.channelId);
  if (player) {
    console.log(`Received sound file: ${prettyBytes(req.files.data.size)}`);
    player.playFile(req.files.data.tempFilePath, req.query.id);
    res.sendStatus(200);
    return;
  }

  res.sendStatus(400);
});

/**
 * Stop a specific sound in channel
 */
router.post('/:channelId/stop/sound', (req, res) => {
  const player = bot.player(req.params.channelId);

  if (player) {
    player.stop(req.query.id);
    res.sendStatus(200);
    return;
  }

  res.sendStatus(400);
});

module.exports = router;
