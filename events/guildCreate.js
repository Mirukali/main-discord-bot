const guildsettingskeys = require('../config/defaultServerSettings.json');
const { NODE_ENV } = process.env;

module.exports = async (guild) => {

    if (!client.provider.isReady) return;

    if (NODE_ENV === 'development') {
        const betaTester = client.guilds.get('422391405101711360').roles.find((r) => r.name.toLowerCase() === 'beta tester').members.array();
        let betaTesterAccess;

        await betaTester.forEach((member) => {
            if (member.id === guild.ownerID) betaTesterAccess = true;
        });

        if (!betaTesterAccess) {
            try {
                await guild.owner.send('You are not a Beta Tester :(');
            }
            catch (error) {
                undefined;
            }
            return guild.leave();
        }
    }

    // Add missing setting in setting array
    const guildSettings = client.provider.initGuildMap(guild.id);
    for (const key in guildsettingskeys) {
        if (!guildSettings[key] && guildSettings[key] === 'undefined') {
            guildSettings[key] = guildsettingskeys[key];
        }
    }
    await client.provider.setGuildComplete(guild.id, guildSettings);
};