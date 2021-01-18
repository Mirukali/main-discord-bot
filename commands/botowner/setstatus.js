const Command = require('../../structures/Command');
const { startstatus, stopstatus } = require('../../plugin/autostatus');

module.exports = class SetStatusCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'setstatus',
            memberName: 'setstatus',
            group: 'botowner',
            description: 'Set bot status',
            ownerOnly: true,
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
        if (status == "start") {
            startstatus(message.client);
            message.reply('Starting auto set status');
        }
        else if (status == "stop") {
            stopstatus(message.client);
            message.reply('Stoping auto set status');
        }
        else {
            try {
                message.client.user.setActivity(status);
            } catch (error) {
                message.reply(error);
            }
        }
    }
}