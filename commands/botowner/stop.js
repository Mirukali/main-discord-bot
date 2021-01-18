const Command = require('../../structures/Command');

module.exports = class StopCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'stop',
            memberName: 'stop',
            group: 'botowner',
            description: "Stop a bot",
            ownerOnly: true,
        })
    }
    run(message, args) {
        message.reply("Good bye my friends");
        console.log(message.author.username + " stop a bot");
        setTimeout(() => {
            process.exit();
        }, 1000);
    }
}