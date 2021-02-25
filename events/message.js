const guildsettingskeys = require('../config/defaultServerSettings.json');
const usersettingskeys = require('../config/defaultUserSettings.json');
const botsettingskeys = require('../config/defaultBotSettings.json');

module.exports = async (client, message) => {
    try {
        // Ignore bot
        if (message.author.bot) return;
        // Everything will trigger when provider is ready
        if (!client.provider.isReady) return;

        if (client.provider.getGuild(message.guild.id)) {
            const settings = client.provider.guildSettings.get(message.guild.id);
            for (const key in guildsettingskeys) {
                if (!settings[key] && typeof settings[key] === 'undefined') {
                    settings[key] = guildsettingskeys[key];
                }
            }
            await client.provider.setGuildComplete(message.guild.id, settings);
        }
        if (client.provider.getUser(message.author.id)) {
            const settings = client.provider.userSettings.get(message.author.id);
            for (const key in usersettingskeys) {
                if (!settings[key] && typeof settings[key] === 'undefined') {
                    settings[key] = usersettingskeys[key];
                }

                if (typeof usersettingskeys[key] === 'object') {
                    for (const key2 in usersettingskeys[key]) {
                        if (!settings[key][key2]) {
                            settings[key][key2] = usersettingskeys[key][key2];
                        }
                    }
                }
            }
            await message.client.provider.setUserComplete(message.author.id, settings);
        }
        else {
            await message.client.provider.reloadUser(message.author.id);
        }
        if (client.provider.getBotsettings('botconfs')) {
            const settings = client.provider.botSettings.get('botconfs');
            for (const key in botsettingskeys) {
                if (!settings[key]) {
                    settings[key] = botsettingskeys[key];
                }
            }
            await message.client.provider.setBotconfsComplete('botconfs', settings);
        }
        else {
            await message.client.provider.setBotconfsComplete('botconfs', botsettingskeys);
        }

    } catch (err) {
        message.channel.send(`Errors found:\n\`\`\`${err}\nAt ${err.stack}\`\`\``);
    }
};