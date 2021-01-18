const Discord = require("discord.js");
const { MODMAILCHAN } = process.env;

module.exports = (message) => {
    const logmodmail = message.client.channels.cache.get(MODMAILCHAN.toString());
    if (logmodmail) {
        const Embed = new Discord.MessageEmbed()
            .setAuthor(message.author.username + " (" + message.author.id + ")", message.author.displayAvatarURL())
            .setColor(Math.random() * 16777216)
            .setFooter("Sent at: ")
            .setTimestamp(message.timestamps)
        if (message.attachment) Embed.setImage((message.attachment[0]).proxy_url);
        if (message.content) Embed.setDescription(message.content);
        logmodmail.send(Embed);
    }
};