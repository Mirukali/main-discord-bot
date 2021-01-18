const { PREFIX, MODMAILCHAN } = process.env;
const { MessageEmbed } = require('discord.js');
const modmail = require('../plugin/modmail');

module.exports = (client, message) => {
    try {
        // Ignore bot
        if (message.author.bot) return;
        // gets the command file and runs the execute function
        const args = message.content.slice(PREFIX.length).trim().split(' ');
        const command = args.shift().toLowerCase();
        if (message.channel.type === "dm") {
            modmail(message);
            return;
        }
        // Run command in server only
        if (client.commands.get(command) && message.channel.type != "dm" && message.content.startsWith(PREFIX)) {
            if (client.commands.get(command).mod) {
                client.commands.get(command).run(message, args);

            } else {
                // if the command doesn't exist, notify the user
                message.channel.send(`${command} command does not exist`);
            }
        }

    } catch (err) {
        message.channel.send(`Errors found:\n\`\`\`${err}\nAt ${err.stack}\`\`\``);
    }
};