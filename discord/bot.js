const discord = require('discord.js');
const rpgDiceRoller = require('rpg-dice-roller/lib/umd/bundle.min.js');
const pe = require('pretty-error').start();
const embeds = require('./embeds');
const AudioPlayer = require('./audioplayer');
const print = require('../util/print');

const diceRoller = new rpgDiceRoller.DiceRoller();

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const AUTO_JOIN = process.env.DISCORD_AUTO_JOIN;
const PREFIX = '!gm ';

const HELP = embeds.help();
const HELP_ROLL = embeds.helpRoll();

class DiscordBot {
  constructor() {
    // Intialize discord client
    this.client = new discord.Client();

    this.client.on('ready', async () => {
      console.log('Connected to discord.\n');

      // Auto join channel
      if (AUTO_JOIN) {
        console.log(`Auto joining channel ${AUTO_JOIN} ...`);
        this.client.channels.fetch(AUTO_JOIN)
          .then((channel) => {
            this.joinChannel(channel);
          })
          .catch((error) => this._handleError(undefined, error));
      }
    });

    this.client.on('message', (message) => this.handleMessage(message));
    this.client.on('error', this._logError);

    this.audioPlayers = new Map();

    // Connect to discord
    this.connect();
  }

  /**
   * Connect to discord
   */
  connect() {
    if (BOT_TOKEN) {
      console.log(`Discord Bot Token: ${this.token()}\n`);
      console.log('Connecting to discord ...');

      this.client.login(BOT_TOKEN);
    } else {
      console.log('No discord bot token set.');
    }
  }

  /**
   * Get the connection status: 'connected' or 'not connected'
   */
  status() {
    return this.client.user ? 'connected' : 'not connected';
  }

  /**
   * Get the bot token in a printable way
   */
  token() {
    if (BOT_TOKEN) {
      return print.secret(BOT_TOKEN);
    }

    return 'No bot token set';
  }

  /**
   * Error handling, try to reply with an error message.
   * If that fails, try to send a dm or if that does not work either,
   * simply log the error.
   */
  _handleError(message, error, help = HELP) {
    const errorMessage = error.message ? error.message : error;

    if (message) {
      // Try to post error message in text channel
      message.reply(errorMessage)
        .catch((error2) => {
          // Could not post to text channel
          // Try to DM member
          message.member.createDM()
            .then((dmChannel) => {
              dmChannel.send(`Error: ${errorMessage}`);
              dmChannel.send(help);
            })
            .catch((error3) => {
              this._logError(error);
              this._logError(error2);
              this._logError(error3);
            });
        });
    } else {
      this._logError(error);
    }
  }

  _logError(error) {
    console.error(pe.render(error));
  }

  /**
  * Join the voice channel
  */
  joinChannel(channel, message) {
    if (channel) {
      channel.join()
        .then((connection) => {
          if (this.audioPlayers.has(channel.id)) return;

          console.log(`Joining channel with ID ${channel.id}`);

          if (message) {
            message.reply(`Joining channel with ID \`${channel.id}\``)
              .catch((error) => {
                this._handleError(message, error);
              });
          }

          // Create new audio player for connection
          this.audioPlayers.set(channel.id, new AudioPlayer(connection));

          console.log(`Connected to channel ${channel.id}.\n`);
        })
        .catch((error) => {
          this._handleError(message, error);
        });
    } else {
      this._handleError(message, 'Could not join, user not in a voice channel.\n');
    }
  }

  /**
  * Leave the voice channel
  */
  leaveChannel(message) {
    const { channel } = message.member.voice;

    if (channel) {
      console.log(`Leaving channel ${channel.id} ...`);
      channel.leave();
      this.audioPlayers.delete(channel.id);
    }
  }

  /**
   * Get the audio player for a given channel id
   */
  player(channelId) {
    return this.audioPlayers.get(channelId);
  }

  /**
  * Roll dice and post result as reply
  */
  rollDice(message, args) {
    if (args.length < 1 || args[0] === 'help') {
      // Display dice help message
      message.reply(HELP_ROLL)
        .catch((error) => this._handleError(message, error, HELP_ROLL));
    } else {
    // Let's roll
      try {
        message.reply(`\`${diceRoller.roll(args[0])}\``)
          .catch((error) => this._handleError(message, error, HELP_ROLL));
      } catch (error) {
        this._handleError(message, error, HELP_ROLL);
      }
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(message) {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).split(' ');
    const command = args.shift().toLowerCase();

    console.log(`Command: ${command}`);
    if (args && args.length) console.log(`Arguments: ${args}`);

    if (command === 'help') {
      message.reply(HELP)
        .catch((error) => this._handleError(message, error));
    } else if (command === 'roll') {
      this.rollDice(message, args);
    } else if (command === 'join') {
      this.joinChannel(message.member.voice.channel, message);
    } else if (command === 'leave') {
      this.leaveChannel(message);
    } else {
      message.reply(`Unknown command \`${command}\``);
      message.reply(HELP);
    }
  }
}


module.exports = DiscordBot;
