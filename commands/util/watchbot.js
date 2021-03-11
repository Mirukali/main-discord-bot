const Command = require('@structures/Command');
const { MessageEmbed } = require('discord.js');


module.exports = class WatchBotCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'watchbot',
            memberName: 'watchbot',
            group: 'util',
            aliases: ['wb'],
            description: 'Watchbot feature',
            clientPermission: ['SEND_MESSAGES'],
            userPermission: ['MANAGE_GUILD'],
            examples: ['wb watch @Alikuxac', 'wb ignore @Alikuxac', 'wb channel #channel', 'wb role @Admin'],
            args: [
                {
                    key: 'action',
                    prompt: 'What do you want to do?',
                    type: 'string',
                    default: 'help'
                },
                {
                    key: 'value',
                    prompt: 'What do you want to put?',
                    type: 'string',
                    default: ''
                }
            ]
        });
    }
    async run(message, args) {
        const prefix = message.guild.commandPrefix;
        const helpEmbed = new MessageEmbed()
            .setAuthor(`${message.author.tag} (${message.author.id})`, message.member.displayAvatarURL)
            .setColor(message.member.displayColor)
            .setDescription(`${prefix}watchbot <on/off>: Change status for watchbot feature
            \n${prefix}watchbot watch <BotID/Mention>: Add/Delete bot to/from watchlist.
            \n${prefix}watchbot ignore <BotID/Mention>: Add/Delete bot to/from ignorelist.
            \n${prefix}watchbot channel <#channel/channelID>: Set notification channel.
            \n${prefix}watchbot role <RoleMention/RoleID/RoleName>: Set role for mention
            \n${prefix}watchbot mode <all/specific>: Change watchbot type.
            \n${prefix}watchbot reset: Reset all setting and turn off feature.
            \n${prefix}watchbot status: Check current watchbot setting in this server.`)

        if (!args) return message.channel.send({ embed: helpEmbed });

        const settings = await message.client.provider.fetchGuild(message.guild.id, 'watchbot');
        switch (args.action) {
            case 'on':
                if (settings == undefined) {
                    const defaultSetting = {
                        "status": "off",
                        "channel": "",
                        "mode": "all",
                        "list": {
                            "watch": [],
                            "ignore": []
                        },
                        "role": ""
                    }

                    try {
                        message.client.provider.setGuild(message.guild.id, 'watchbot', defaultSetting)
                        message.channel.send(`Turn on successfull`);
                    } catch (err) {
                        message.channel.send('Error while turning on this feature.')
                    }
                } else if (settings.status == 'off') {
                    settings.status = 'on';
                    message.client.provider.setGuild(message.guild.id, 'watchbot', settings)
                    message.channel.send(`Turn on successfull`);
                }
                break;

            case 'off':
                if (settings == undefined) return message.reply(`This server haven't turn on feature yet.`);
                if (settings.status == 'off') return message.reply(`This feature in this server is off.`)
                try {
                    settings.status = 'off';
                    message.client.provider.setGuild(message.guild.id, 'watchbot', settings);
                    message.channel.send(`Turn off successfull`);
                } catch (err) {
                    message.channel.send('Error while turning off this feature.')
                }
                break;

            case 'watch':
                if (settings == undefined || settings.status == 'off') return message.reply(`This server haven't turn on feature yet.`);
                if (settings.mode == 'all') return message.reply(`You can't add bot to watch list because the current mode is \`all\``);
                const botwatch = message.mentions.members.first() || message.guild.members.cache.get(args.value);
                if (!botwatch) { return message.reply(`Member not found. Please try again.`); }
                if (!botwatch.user.bot) { return message.reply(`This user is not bot.`); }
                if (!settings.list.watch.includes(botwatch.user.id)) {
                    try {
                        settings.list.watch.push(botwatch.user.id);
                        message.client.provider.setGuild(message.guild.id, 'watchbot', settings);
                        message.channel.send(`Add bot <@${botwatch.user.id}> to watch list successfull`);
                    } catch (err) {
                        message.channel.send(`Error while adding bot to watch list`)
                    }
                } else {
                    try {
                        settings.list.watch.splice(settings.list.watch.indexOf(botwatch.user.id), 1);
                        message.client.provider.setGuild(message.guild.id, 'watchbot', settings);
                        message.channel.send(`Remove bot <@${botwatch.user.id}> to watch list successfull`);
                    } catch (err) {
                        message.channel.send(`Error while removing bot to the list`)
                    }
                }

                break;

            case 'ignore':
                if (settings == undefined || settings.status == 'off') return message.reply(`This server haven't turn on feature yet.`);
                const botignore = message.mentions.members.first() || message.guild.members.cache.get(args.value);
                if (!botignore) { return message.reply(`Member not found. Please try again.`); }
                if (!botignore.user.bot) { return message.reply(`This user is not bot.`); }
                if (!settings.list.ignore.includes(botignore.user.id)) {
                    try {
                        settings.list.ignore.push(botignore.user.id);
                        message.client.provider.setGuild(message.guild.id, 'watchbot', settings);
                        message.channel.send(`Add bot <@${botignore.user.id}> to ignore list successfull`);
                    } catch (err) {
                        message.channel.send(`Error while adding bot to the list`)
                    }
                } else {
                    try {
                        settings.list.ignore.splice(settings.list.ignore.indexOf(botignore.user.id), 1);
                        message.client.provider.setGuild(message.guild.id, 'watchbot', settings);
                        message.channel.send(`Remove bot <@${botignore.user.id}> to ignore list successfull`);
                    } catch (err) {
                        message.channel.send(`Error while removing bot to ignore list`);
                        console.error(err);
                    }
                }

                break;

            case 'channel':
                if (settings == undefined || settings.status == 'off') return message.reply(`This server haven't turn on feature yet.`);
                if (!args.value) {
                    if (settings.channel) {
                        settings.channel = '';
                        message.client.provider.setGuild(message.guild.id, 'watchbot', settings);
                        message.channel.send('Clear channel from settings successful');
                    } else {
                        message.channel.send(`Usage: ${prefix}watchbot channel <ChannelMention/ChannelID>`)
                    }
                    return;
                }
                const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args.value);
                if (!channel) return message.reply(`Invalid channel. Please try again`);

                try {
                    settings.channel = channel.id.toString();
                    message.client.provider.setGuild(message.guild.id, 'watchbot', settings);
                    message.channel.send(`Set channel <#${channel.id}> successful`);
                } catch (err) {
                    message.channel.send(`Error while setting channel.`);
                }
                break;

            case 'mode':
                const modelist = ['specific', 'all'];
                if (settings == undefined || settings.status == 'off') return message.reply(`This server haven't turn on feature yet.`);
                if (!modelist.includes(args.value)) return message.reply(`Invalid mode. Only support \`specific\` and \`all\` `);

                try {
                    settings.mode = args.value;
                    message.client.provider.setGuild(message.guild.id, 'watchbot', settings);
                    message.channel.send(`Set mode \`${args.value}\` successful`);
                } catch (err) {
                    message.channel.send(`Error while setting mode.`);
                }
                break;

            case 'role':
                if (settings == undefined || settings.status == 'off') return message.reply(`This server haven't turn on feature yet.`);
                if (!args.value) {
                    if (settings.role) {
                        settings.role = '';
                        message.client.provider.setGuild(message.guild.id, 'watchbot', settings);
                        message.channel.send('Clear role from settings successful');

                    } else {
                        message.channel.send(`Usage: ${prefix}watchbot role <RoleMention/RoleID/RoleName>`)
                    }
                    return;
                }
                const rolem = message.mentions.roles.first() || message.guild.roles.cache.find(role => role.name.toLowerCase().includes(args.value.toLowerCase())) || message.guid.roles.cache.find(role => role.id === args.value);
                if (!rolem) return message.reply('Invalid role.');

                try {
                    settings.role = rolem.id;
                    message.client.provider.setGuild(message.guild.id, 'watchbot', settings);
                    message.channel.send(`Set role \`${rolem.name}\` successful`);
                } catch (err) {
                    message.channel.send(`Error while setting role for mention.`);
                }
                break;
            case 'reset':
                if (settings == undefined || settings.status == 'off') return message.reply(`This server haven't turn on feature yet.`);

                const requestMsg = await message.channel.send('Are you sure to do this?');
                requestMsg.react('✅').then(() => { requestMsg.react('❎'); });
                const filter = (reaction, user) => {
                    return ['✅', '❎'].includes(reaction.emoji.name) && user.id == message.author.id;
                };
                const collector = requestMsg.createReactionCollector(filter, { time: 15000 });
                collector.on('collect', (reaction, user) => {
                    if (reaction.emoji.name == '✅') {
                        const resetSetting = {
                            "status": "off",
                            "channel": "",
                            "mode": "all",
                            "list": {
                                "watch": [],
                                "ignore": []
                            },
                            "role": ""
                        }
                        message.client.provider.setGuild(message.guild.id, 'watchbot', resetSetting);
                        requestMsg.edit(`Reset settings successfull`);
                        message.reactions.removeAll();
                        collector.stop();
                    } else if (reaction.emoji.name == '❎') {
                        requestMsg.edit('Operation canceled');
                        message.reactions.removeAll();
                        collector.stop();
                        return;
                    }
                })
                collector.on('end', () => {
                    message.reactions.removeAll();
                });
                break;

            case 'status':
                if (settings == undefined) return message.reply(`I don't get any setting in this server`);

                let status = settings.status;
                let channelstatus = settings.channel == '' ? 'None' : `<#${settings.channel}>`;
                let mode = settings.mode;
                let botwatchdesc = '',
                    botignoredesc = '',
                    rolemention = settings.role ? `<@&${settings.role}>` : 'None';

                if (settings.list.watch.length == 0) {
                    botwatchdesc = 'None';
                } else {
                    settings.list.watch.forEach(element => {
                        botwatchdesc += ` <@${element}> `;
                    });
                }

                if (settings.list.ignore.length == 0) {
                    botignoredesc = 'None';
                } else {
                    settings.list.ignore.forEach(element => {
                        botignoredesc += ` <@${element}> `;
                    });
                }


                const infoEmbed = new MessageEmbed()
                    .setAuthor(message.author.tag)
                    .setTitle('Watchbot settings')
                    .setDescription(`Status: ${status}
                        \nChannel: ${channelstatus}
                        \nMode: ${mode}
                        \nRole: ${rolemention}
                        \nWatch list: ${botwatchdesc}
                        \nIgnore list: ${botignoredesc}`)
                    .setColor(message.member.displayColor)
                    .setFooter(`Server ID: ${message.guild.id}`)

                message.channel.send({ embed: infoEmbed });
                break;
            case 'help':
                message.channel.send({ embed: helpEmbed });
            default:
                break;
        }
    }
}