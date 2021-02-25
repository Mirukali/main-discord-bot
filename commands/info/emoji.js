const Commando = require('discord.js-commando');

module.exports = class EmojiCMD extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'emoji',
            memberName: 'emoji',
            group: 'info',
            description: 'Show basic information of the emoji',
            clientPermissions: ['SEND_MESSAGES'],
            guildOnly: true,
            args: [
                {
                    key: 'emoji',
                    type: 'custom-emoji',
                    prompt: 'Please specific a custom emoji.'
                }
            ]
        });
    }
    run(msg, { emoji }) {
        if (!emoji) return msg.reply('Please specific a custom emoji.');

        let animated = emoji.animated ? 'gif' : 'png';
        let name = emoji.name.toString();
        let id = emoji.id;
        msg.channel.send(`Name: ${name}\nID: ${id}\nLink: https://cdn.discordapp.com/emojis/${id}.${animated}?v=1`);
    }
};