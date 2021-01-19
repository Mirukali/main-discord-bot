/* eslint-disable no-unused-vars */
const Command = require('../../structures/Command');

module.exports = class VRandomCMD extends Command {
    constructor(client) {
        super(client, {
            name: 'vrandom',
            group: 'voice',
            memberName: 'vrandom',
            aliases: ['vrand', 'voicerand', 'voicerandom'],
            description: 'Choose random member in author voice channel.',
            throttling: {
                usages: 1,
                duration: 5,
            },
            guildOnly: true,
        });
    }
    run(message, args) {
        const voicechan = message.member.voice.channel;
        if (!voicechan) return message.reply('You are not in voice. Please join a voice channel and try again.');

        let voice = voicechan.members.array();
        let randmem = voice[Math.floor(Math.random() * voice.length)];
        message.channel.send(`Bot choose *${randmem.user.username}* in ${voicechan.name} voice channel that have ${voice.length} member(s)`);
    }
};