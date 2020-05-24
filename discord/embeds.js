const discord = require('discord.js');

/**
 * Basic help, shows available commands
 */
function help() {
  return new discord.MessageEmbed()
    .setTitle('Usage: `!gm [command]`')
    .addFields(
      { name: '`help`', value: 'Show this help text.' },
      { name: '`join`', value: 'Invite the bot to your current voice channel. Will reply with the channel id that you can then use to control the bot from the gm-companion.' },
      { name: '`leave`', value: 'Remove the bot from your current voice channel.' },
      { name: '`roll` [arguments]', value: 'Roll some dice, see `roll help` for usage.' },
    );
}

/**
 * Show the most important commands for rolling dice
 */
function helpRoll() {
  return new discord.MessageEmbed()
    .setTitle('Usage: `!gm roll [arguments]`')
    .addFields(
      { name: '`d6`', value: 'Roll a 6 sided dice.' },
      { name: '`4d10`', value: 'Roll a 10 sided dice 4 times.' },
      { name: '`4d%`', value: 'Roll a percentile die 4 times.' },
      { name: '`dF`', value: 'Roll a standard Fudge die. Equivalent to `dF.2`.' },
      { name: '`dF.2`', value: 'Roll a standard fudge dice. Equivalent to `dF`.' },
      { name: '`dF.1`', value: 'Roll the variant fudge dice.' },
      { name: '`4dF`', value: 'Roll a standard Fudge die 4 times.' },
      { name: '`5d10!k2`', value: 'Keep only the highest 2 rolls.' },
    )
    .setFooter('For more options see https://github.com/GreenImp/rpg-dice-roller#supported-notation.');
}

module.exports = { help, helpRoll };
