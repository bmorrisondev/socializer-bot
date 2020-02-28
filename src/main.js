const config = require('./app.config.json')
const Discord = require('discord.js');
const client = new Discord.Client();
const Twitter = require('twitter');
const dynamoose = require('dynamoose');

dynamoose.AWS.config.update(config.awsConfig);

const TwitterAccountMap = dynamoose.model('socializer-bot-config', {
  discordChannelId: String,
  twitterAccountId: String
});

const twitterClient = new Twitter(config.twitter);

const token = config.discord.botToken

const channelIdOut = config.discord.channelIdOut

let stream;
// let followingIds = [
//   // "1315671481"
// ]

let followAccountMaps = [
  //twitterId: [ 'channelId', 'channelId' ]
]

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
  if(msg.content.startsWith("!follow")) {
    // console.log(msg)
    let args = msg.content.split(" ");
    try {
      let userId = await getTwitterUserId(args[1]);

      if(followAccountMaps[userId] && followAccountMaps[userId].find(cid => cid == msg.channel.id)) {
        msg.reply(`Already following ${args[1]}.`)
        return;
      }
      await followTwitterAccount(userId, msg.channel.id)
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

async function followTwitterAccount(accountId, discordChannelId) {
  return new Promise(async (resolve, reject) => {
    // followingIds.push(accountId);
    let channelMap = followAccountMaps[accountId];
    if(!channelMap){
      channelMap = []
    }
    channelMap.push(discordChannelId)
    followAccountMaps[accountId] = channelMap
    await restartStream();
    resolve();
  })
}

client.on('error', err => {
  console.log(err)
});

client.login(token);

async function getTwitterUserId (screenName) {
  return new Promise((resolve, reject) => [
    twitterClient.get('users/show', { screen_name: screenName }, (err, userInfo) => {
      if(err) {
        console.log(err)
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
    let followingIds = Object.keys(followAccountMaps).map(m => m)
    if(followingIds.length === 0)  {
      console.log("no ids to follow :(")
      return;
    }
    // var followingJoined = followingIds.join(",");
    let followingJoined = Object.keys(followAccountMaps).map(m => m).join(",")
    console.log(followingJoined)
    var opt = {
      follow: followingJoined
    }
    stream = twitterClient.stream('statuses/filter', opt);
    stream.on('data', function(event) {
      // console.log(JSON.stringify(event))
      const embed = buildEmbed(event)
      let channels = followAccountMaps[event.user.id]
      channels.forEach(c => {
        client.channels.get(c).send(embed)
      })
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
      // "url": tweetEvent.entities.urls[0].expanded_url,
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

// Create cat model with default options
// const TwitterAccountMap = dynamoose.model('socializer-bot-config', {
//   discordChannelId: String,
//   twitterAccountId: String
// });

// Create a new cat object
// let map = new TwitterAccountMap({
//   discordChannelId: channelIdOut,
//   twitterAccountId: '1315671481'
// });

// Save to DynamoDB
// map.save(); // Returns a promise that resolves when save has completed

// Lookup in DynamoDB
// TwitterAccountMap.get(channelIdOut).then((mapFromDynamo) => {
//   console.log(JSON.stringify(mapFromDynamo));
// });