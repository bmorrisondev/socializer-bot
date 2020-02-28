

const TwitterAccountMap = dynamoose.model('socializer-bot-config', {
    discordChannelId: String,
    twitterAccountId: String
});