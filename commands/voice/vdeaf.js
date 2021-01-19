const Command = require('../../structures/Command');

module.exports = class VDeafCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'vdeaf',
            memberName: 'vdeaf',
            group: 'voice',
            aliases: ['voicedeaf'],
            description: 'Deafen the member',
            guildOnly: true,
            throttling: {
                usages: 1,
                duration: 5,
            },
            clientPermissions: ['DEAFEN_MEMBERS'],
            userPermissions: ['DEAFEN_MEMBERS'],
            args: [
                {
                    key: 'member',
                    type: 'member',
                    prompt: 'Please specific member to deaf.'
                }
            ]
        });
    }
    run(message, { member }) {
        // Get member from mention or ID.
        if (!member) return message.channel.send('Cannot found this member.');
        if (member.id == message.guild.ownerID) return message.channel.send('You can deaf voice the owner. 🥴');

        if (!member.voice.channel) return message.channel.send(`I can't deafen user that not in voice channel. :(`);
        try {
            member.voice.setDeaf(true, 'Deafen a member');
            message.channel.send(`${member.user.username} deafen successfully.`);
        } catch (err) {
            message.channel.send(err);
        }
    }
    onBlock(message, reason, data) {
        if (reason === 'clientPermissions') return message.reply(`Bot don't have \`${data.missing}\` Permissions to run this command.`);
        else if (reason === 'permission') return message.reply(`${data.response}`);
    }
};