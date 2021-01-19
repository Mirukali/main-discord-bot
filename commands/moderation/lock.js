const Discord = require('discord.js');
const Command = require('../../structures/Command')

module.exports = class LockCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'lock',
            memberName: 'lock',
            group: 'moderation',
            aliases: ['lockdown'],
            description: 'Lock a specific channel or all channel',
            throttling: {
                usages: 1,
                duration: 3,
            },
            guildOnly: true,
            userPermissions: ['MANAGE_CHANNELS'],
            clientPermissions: ['MANAGE_CHANNELS'],
            args: [
                {
                    key: 'channel',
                    prompt: 'Please specific a channel',
                    type: 'channel'
                },
                {
                    key: 'reason',
                    prompt: 'Give bot the reason',
                    type: 'string',
                    default: 'None'
                }
            ]
        });
    }
    run(message, { channel, reason }) {
        let color = message.member.displayHexColor;

        const lockEmbed = new Discord.MessageEmbed()
            .setTitle('Lockdown Status')
            .setColor(color)
            .addField('❯ Status', 'Locked')
            .addField('❯ Channel', (`<#${channel.id}>`))
            .addField('❯ Reason', reason)
        try {
            channel.updateOverwrite(message.guild.id, {
                'SEND_MESSAGES': false
            }, 'Lock a channel');
            message.channel.send(`Locked channel <#${channel.id}> successfully.`);
            channel.send(lockEmbed);
        } catch (err) {
            message.reply(err);
        }
    }
    onBlock(message, reason, data) {
        if (reason === 'clientPermissions') return message.reply(`Bot don't have \`${data.missing}\` Permissions to run this command.`);
        else if (reason === 'permission') return message.reply(`${data.response}`);
        else if (reason === 'throttling') return message.reply(`Please comeback after ${data.remaining} second(s)`);
    }
};