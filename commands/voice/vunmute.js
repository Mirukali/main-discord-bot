const Commando = require('discord.js-commando');

module.exports = class VUmuteCMD extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'vunmute',
            memberName: 'vunmute',
            group: 'voice',
            aliases: ['voiceunmute'],
            description: 'Mute voice of specific member.',
            throttling: {
                usages: 1,
                duration: 5,
            },
            guildOnly: true,
            clientPermissions: ['MUTE_MEMBERS'],
            userPermissions: ['MUTE_MEMBERS'],
            args: [
                {
                    key: 'member',
                    type: 'member',
                    prompt: 'Please specific an user.'
                }
            ]
        });
    }
    run(message, { member }) {
        if (!member) return message.channel.send('Member not found.');
        if (!member.voice.channel) return message.channel.send(`I can't undeafen user that not in voice channel. :(`);

        try {
            member.voice.setMute(false, 'Member voice unmuted.').catch(console.error);
            message.channel.send(`\`${member.user.username}'s\` voice unmuted successfully.`);
        } catch (err) {
            message.channel.send(err);
        }
    }
    onBlock(msg, reason, data) {
        if (reason === 'clientPermissions') return msg.reply(`Bot don't have \`${data.missing}\` Permissions to run this command.`);
        else if (reason === 'permission') return msg.reply(`${data.response}`);
    }
};