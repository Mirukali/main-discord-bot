const Command = require('../../structures/Command');

module.exports = class VUndeafCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'vundeaf',
            memberName: 'vundeaf',
            aliases: ['voiceundeaf'],
            description: 'Undeafen the member',
            group: 'voice',
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

        if (!member) return message.channel.send('Member not found.');
        if (!member.voice.channel) return message.channel.send(`I can't undeafen user that not in voice channel. :(`);
        
        try {
            member.voice.setDeaf(true, 'Member voice deafen.').catch(console.error);
        message.channel.send(`\`${member.user.username}'s\` voice deafen successfully.`);
        } catch (err) {
            message.channel.send(err);
        }
        
    }
    onBlock(msg, reason, data) {
        if (reason === 'clientPermissions') return msg.reply(`Bot don't have \`${data.missing}\` Permissions to run this command.`);
        else if (reason === 'permission') return msg.reply(`${data.response}`);
    }
};