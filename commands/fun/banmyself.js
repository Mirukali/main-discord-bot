const Command = require('../../structures/Command');
const Discord = require('discord.js');

module.exports = class BanMySelfCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'banmyself',
            memberName: 'banmyself',
            group: 'fun',
            description: 'Ban yourself in 5 seconds',
            clientPermissions: ['BAN_MEMBERS'],
            throttling: {
                usages: 1,
                duration: 3600,
            }
        });
    }
    async run(message, args) {

        const author = message.author;
        const member = message.guild.member(author.id);
        if (author.id === message.guild.ownerID) return message.channel.send('Why? Wryyyyyyyyyyyyy');
        // Get bot and member highest position
        let bot = message.guild.me;
        let bothighest = bot.roles.highest.rawPosition;
        let memberhighest = member.roles.highest.rawPosition;

        if (bothighest < memberhighest) return message.channel.send(`Bot can't ban member that higher than bot.`);

        const sentMessage = await message.channel.send('Are you sure to do this?');
        sentMessage.react('✅').then(() => sentMessage.react('❎'));
        const filter = (reaction, user) => {
            return ['✅', '❎'].includes(reaction.emoji.name) && user.id === message.author.id;
        };
        sentMessage.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();

                if (reaction.emoji.name === '✅') {
                    const embed = new Discord.MessageEmbed()
                        .setTitle(`Oh no`)
                        .setDescription('You just ban yourself in Mine & Chill Server.\nIf you want to join again, just wait 5 seconds and click [here](https://discord.gg/8yfv46W) to join.')
                        .setColor(7929857)
                    try {
                        author.createDM();
                        member.send({ embed: embed });
                        member.ban({ days: 0, reason: `${author.username} kill themself` })
                            .then(console.log)
                            .catch(console.error);
                        setTimeout(() => {
                            message.guild.unban(author.id, 'He/She did something stupid :D')
                                .then(user => console.log(`Rescused ${user.username} from ${message.guild.name}`))
                                .catch(console.error);
                        }, 5000); // Wait 5 seconds then unban
                    } catch (error) {
                        message.channel.send(error);
                    }
                } else {
                    message.reply(`Ok. I'm fine`);
                }
            })
            .catch(collected => {
                message.reply(`Why you dont answer my question? :(`);
            });


    }
    onBlock(message, reason, data) {
        if (reason === 'clientPermissions') return message.reply(`Bot don't have \`${data.missing}\` Permissions to run this command.`);
        else if (reason === 'throttling') return message.reply(`Please try again after ${data.remaining} second(s)`);
    }
}