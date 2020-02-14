const config = require('./app.config.json')
const Discord = require('discord.js');
const client = new Discord.Client();
const Twitter = require('twitter');

const twitterClient = new Twitter(config.twitter);

const token = config.discord.botToken

const channelIdOut = config.discord.channelIdOut

let stream;
let followingIds = [
  "1315671481"
]

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
  if(msg.content.startsWith("!follow")) {
    let args = msg.content.split(" ");
    try {
      let userId = await getTwitterUserId(args[1]);
      if(followingIds.find(id => id == userId)) {
        msg.reply(`Already following ${args[1]}.`)
        return;
      }
      followingIds.push(userId);
      await restartStream();
      msg.reply(`Now following ${args[1]}.`)
    } catch (err) {
      if(err === -1) {
        msg.reply(`Unable to find username ${args[1]}.`)
      } else {
        console.log(err)
        msg.reply("Unknown error occurred...")
      }
    }
  }
});

client.on('error', err => {
  console.log(err)
});

client.login(token);

async function getTwitterUserId (screenName) {
  return new Promise((resolve, reject) => [
    twitterClient.get('users/show', { screen_name: screenName }, (err, userInfo) => {
      if(err) {
        reject(err)
      }
      if(!userInfo) {
        reject(-1)
      }
      resolve(userInfo.id)
    })
  ])
}

async function restartStream() {
  stopStream();
  await startStream();
}

function stopStream() {
  if(stream) {
    stream.destroy()
  }
}

async function startStream() {
  return new Promise((resolve) => {
    if(followingIds.length === 0)  {
      console.log("no ids to follow :(")
      return;
    }
    var followingJoined = followingIds.join(",");
    var opt = {
      follow: followingJoined
    }
    stream = twitterClient.stream('statuses/filter', opt);
    stream.on('data', function(event) {
      console.log(JSON.stringify(event))
      const embed = buildEmbed(event)
      client.channels.get(channelIdOut).send(embed)
      // client.channels.get(channelIdOut).send(event.text)
    });
    resolve();
  })
}

function buildEmbed(tweetEvent) {
  return {
    // "content": "this `supports` __a__ **subset** *of* ~~markdown~~ 😃 ```js\nfunction foo(bar) {\n  console.log(bar);\n}\n\nfoo(1);```",
    "embed": {
      // "title": "title ~~(did you know you can have markdown here too?)~~",
      "description": tweetEvent.text,
      "url": tweetEvent.entities.urls[0].expanded_url,
      // "color": 2308848,
      "timestamp": tweetEvent.created_at,
      // "footer": {
      //   "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png",
      //   "text": "footer text"
      // },
      // "thumbnail": {
      //   "url": "https://cdn.discordapp.com/embed/avatars/0.png"
      // },
      // "image": {
      //   "url": "https://cdn.discordapp.com/embed/avatars/0.png"
      // },
      "author": {
        "name": tweetEvent.user.screen_name,
        "url": tweetEvent.user.url,
        "icon_url": tweetEvent.user.profile_image_url_https
      },
      // "fields": [
      //   {
      //     "name": "🤔",
      //     "value": "some of these properties have certain limits..."
      //   },
      //   {
      //     "name": "😱",
      //     "value": "try exceeding some of them!"
      //   },
      //   {
      //     "name": "🙄",
      //     "value": "an informative error should show up, and this view will remain as-is until all issues are fixed"
      //   },
      //   {
      //     "name": "<:thonkang:219069250692841473>",
      //     "value": "these last two",
      //     "inline": true
      //   },
      //   {
      //     "name": "<:thonkang:219069250692841473>",
      //     "value": "are inline fields",
      //     "inline": true
      //   }
      // ]
    }
  }
}

startStream();
console.log('done')
