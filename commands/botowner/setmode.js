const Command = require('../../structures/Command');

class SetModeCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'setmode',
            memberName: 'setmode',
            group: 'botowner',
            description: 'Set mode of the bot',
            ownerOnly: true,
            hidden: true,
            args: [
                {
                    key: 'mode',
                    type: 'string',
                    prompt: 'What mode do you want to set?',
                    oneOf: ['dnd', 'idle', 'online', 'invisible']
                }
            ]
        });
    }
    run(message, { mode }) {
        if (!mode) return message.channel.send('Available mode: dnd, idle, online, invisible');
        try {
            message.client.user.setStatus(mode).then(status => { message.reply(`Successful set status to ${status.status}`) });
        } catch (err) {
            message.channel.send('Error occurred while setting status for bot');
            console.log(err);
        }
    }
}

module.exports = SetModeCMD;