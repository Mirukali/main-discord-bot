const Command = require('../../structures/Command');

module.exports = class SetStatusCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'setstatus',
            memberName: 'setstatus',
            group: 'botowner',
            description: 'Set bot status',
            ownerOnly: true,
            hidden: true,
            aliases: ['sstatus'],
            args: [
                {
                    key: 'status',
                    prompt: 'What status do you want to set?',
                    type: 'string',
                }
            ]
        })
    }
    run(message, { status }) {
        try {
            message.client.user.setActivity(status)
                .then(presence => message.channel.send(`Activity set to ${presence.activities[0].name}`))
        } catch (error) {
            message.reply('Error occurred while set activity for bot');
        }
    }
}