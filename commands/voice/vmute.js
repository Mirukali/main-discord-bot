
const Command = require('../../structures/Command');

module.exports = class VMuteCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'vmute',
            memberName: 'vmute',
            group: 'voice',
            aliases: ['voicemute'],
            description: 'Mute voice of specific member.',
            throttling: {
                usages: 1,
                duration: 5,
            },
            clientPermissions: ['MUTE_MEMBERS'],
            userPermissions: ['MUTE_MEMBERS'],
            guildOnly: true,
            args: [
                {
                    key: 'member',
                    type: 'member',
                    prompt: 'Please specific member'
                }
            ]
        });
    }
    run(message, { member }) {
        if (!member) return message.channel.send('Member not found.');
        if (member.id == message.guild.ownerID) return message.channel.send('You can deaf voice the owner. 🥴');

        if (!member.voice.channel) return message.channel.send(`${member.user.username} isn't in voice channel.`);
        try {
            member.voice.setMute(true, 'Member voice muted.')
            message.channel.send(`\`${member.user.username}'s\` voice muted successfully.`);
        } catch (err) {
            message.channel.send(err);
        }
    }
    onBlock(message, reason, data) {
        if (reason === 'clientPermissions') return message.reply(`Bot don't have \`${data.missing}\` Permissions to run this command.`);
        else if (reason === 'permission') return message.reply(`${data.response}`);
    }
};