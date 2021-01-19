const Commando = require('discord.js-commando');
const Discord = require('discord.js');
const fetch = require("node-fetch");

module.exports = class BotListCMD extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'botlist',
            memberName: 'botlist',
            group: 'util',
            description: 'Check bot list in specific website',
            clientPermissions: ['SEND_MESSAGES'],
            guildOnly: true,
            args: [
                {
                    key: 'user',
                    type: 'user',
                    prompt: 'What bot do you want to check?'
                }
            ]
        });
    }
    async run(message, { user }) {

        const greentick = '✅';
        const graytick = '?';
        const redtick = '❎';
        if (!user.bot) return message.reply('This user is not a bot.');
        const q = user.id;
        const links = [
            {
                name: 'top.gg',
                url: `https://top.gg/bot/${q}`,
                fetch: true
            },
            {
                name: 'discordbotlist.com',
                url: `https://discordbotlist.com/bots/${q}`,
                fetch: true
            },
            {
                name: 'discord.bots.gg',
                url: `https://discord.bots.gg/bots/${q}`,
                fetch: true
            },
            {
                name: 'bots.ondiscord.xyz',
                url: `https://bots.ondiscord.xyz/bots/${q}`,
                fetch: true
            },
            {
                name: 'discord.boats',
                url: `https://discord.boats/bot/${q}`,
                fetch: true
            },
            {
                name: 'botsfordiscord.com',
                url: `https://botsfordiscord.com/bot/${q}`,
                fetch: false
            }
        ];
        let output = `${greentick}: <@${user.id}> is on this bot list\n${redtick}: <@${user.id}> is not on this bot list\n${graytick}: This bot list cannot be scanned\n\n`;
        for (let link of links) {
            if (link.fetch) {
                let res = await fetch(link.url);
                let ok = res.ok || res.redirected;
                output += `${ok ? greentick : redtick} [${link.name}](${link.url})\n`;
            } else {
                output += `${graytick} [${link.name}](${link.url})`;
            }
        }
        const embed = new Discord.MessageEmbed()
            .setTitle(`Check list`)
            .setDescription(output)
            .setAuthor(message.author.username, message.author.avatarURL(2048))
        message.channel.send(embed)
    }
};