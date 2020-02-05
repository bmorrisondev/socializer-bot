const Discord = require('discord.js');
const client = new Discord.Client();

const token = ""

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }

  if(msg.content.startsWith("!follow")) {
    let args = msg.content.split(" ");
    msg.reply(`Now following ${args[1]}`);
  }
});

client.login(token);
