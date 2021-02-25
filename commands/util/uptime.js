const Command = require('../../structures/Command');
const { MessageEmbed } = require('discord.js');
require("moment-duration-format");

module.exports = class UpTimeCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'uptime',
            memberName: 'uptime',
            group: 'util',
            description: 'Check uptime of bot'
        })
    }
    async run(message, args) {
        const humanizeDuration = require('humanize-duration');

        let myDate = new Date(this.client.readyTimestamp);
        const embed = new MessageEmbed()
            .addField(":white_check_mark: Uptime:", `**${humanizeDuration(this.client.uptime, { round: true })}**`, true)
            .addField("Memory usage:", Math.trunc((process.memoryUsage().heapUsed) / 1024 / 1000) + "mb", true)
            .setFooter(`Ready Timestamp: ${myDate.toString()}`)
            .setColor("GREEN")
        message.channel.send(embed);
    }

}
