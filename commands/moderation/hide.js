const Command = require('../../structures/Command');

module.exports = class HideCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'hide',
            memberName: 'hide',
            group: 'moderation',
            description: 'Hide a specific channel',
            throttling: {
                usages: 1,
                duration: 3,
            },
            guildOnly: true,
            clientPermissions: ['MANAGE_CHANNELS'],
            userPermissions: ['MANAGE_CHANNELS'],
            args: [
                {
                    key: 'channel',
                    label: 'channel',
                    type: 'channel',
                    prompt: 'Please specific a channel'
                }
            ]
        });
    }
    run(message, { channel }) {
        if (!channel) return message.channel.send('Channel not found');

        try {
            channel.updateOverwrite(message.guild.id, {
                'VIEW_CHANNEL': false
            }, 'Unhide a channel');
            message.channel.send(`Hide channel <#${channel.id}> successfully.`);
        } catch (err) {
            message.reply(`I can't hide channel because there is an error.`);
            console.error(err);
        }
    }
    onBlock(message, reason, data) {
        if (reason === 'clientPermissions') return message.reply(`Bot don't have \`${data.missing}\` Permissions to run this command.`);
        else if (reason === 'permission') return message.reply(`${data.response}`);
        else if (reason === 'throttling') return message.reply(`Please comeback after ${data.remaining} second(s)`);
    }
};