const Command = require('../../structures/Command');
const exec = require('child_process').exec;

module.exports = class CheckUpdateCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'check-update',
            memberName: 'check-update',
            group: 'botowner',
            description: 'Check update from officical github',
            ownerOnly: true,
            hidden: true
        })
    }
    run(message, args) {
        exec(`git pull`, (error, stdout) => {
            let response = (error || stdout);
            console.log(response);
            if (!error) {
                if (response.includes("Already up to date.")) {
                    message.channel.send('Bot already up to date. No changes since last pull')
                } else {
                    message.channel.send('Pulled from GitHub. Restarting bot. \n\nLogs: \n```' + response + "```")
                    setTimeout(() => {
                        process.exit();
                    }, 1000)
                };
            }
        });
    }
}