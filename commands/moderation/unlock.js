const Discord = require('discord.js');
const Commando = require('discord.js-commando');

module.exports = class UnlockCMD extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'unlock',
            memberName: 'unlock',
            group: 'moderation',
            description: 'Unlock a specific channel or all channel',
            throttling: {
                usages: 1,
                duration: 3,
            },
            guildOnly: true,
            clientPermissions: ['MANAGE_CHANNELS'],
            userPermissions: ['MANAGE_CHANNELS'],
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
    run(msg, { channel, reason }) {
        let color = msg.member.displayHexColor;

        const lockEmbed = new Discord.MessageEmbed()
            .setTitle('Lockdown Status')
            .setColor(color)
            .addField('❯ Status', 'Unlocked')
            .addField('❯ Channel', (`<#${channel.id}>`))
            .addField('❯ Reason', reason)

        try {
            channel.updateOverwrite(msg.guild.id, {
                'SEND_MESSAGES': null
            }, 'Lock a channel');
            msg.channel.send(`Unlocked channel <#${channel.id}> successfully.`);
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