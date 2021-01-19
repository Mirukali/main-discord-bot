const Command = require('../../structures/Command');

const rolelist = ["657757704084914196", "655432735950897163", "657240378562445333"]; // Founder - Owner - Staff
class DMCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'dm',
            group: 'other',
            memberName: 'dm',
            description: 'Reply an user with message',
            aliases: [],
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 60,
            },
            args: [
                {
                    key: 'dmmember',
                    prompt: 'What user do you want to DM?',
                    type: 'member',
                },
                {
                    key: 'msg',
                    prompt: 'Message you want to send?',
                    type: 'string'
                }
            ]
        });
    }
    run(message, { dmmember, msg }) {
        // Check if user has Staff role or Administrator Permission
        let perm = message.member.roles.cache.has('657240378562445333') || message.mem.roles.hasPermission('ADMINISTRATOR');
        if (!perm) return message.reply("You don't have specific role to run this command.");
        if (!dmmember) return message.reply('User not found. Please try again.');
        if (dmmember.user.bot) return message.reply("I can't DM to another bot :(");
        if (!msg) return message.reply('Please specific message you want to send to that user');
        try {
            dmmember.user.createDM();
            dmmember.send(msg);
            message.reply("Sent successful");
        } catch (err) {
            message.reply(err);

        }

    }
}

module.exports = DMCMD;