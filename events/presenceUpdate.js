const utils = require('../util/utils');

module.exports = async (oldPresence, newPresence) => {
    try {
        if (!oldPresence) return;
        const guild = newPresence.guild;
        const newUser = newPresence.member;
        let status = '', rolemention = '';

        const WatchSettings = await guild.client.provider.getGuild(guild.id, 'watchbot');
        if (WatchSettings.status === "on" && newUser.user.bot) {
            if (WatchSettings.list.ignore.includes(newPresence.userID)) return;
            let channel = newPresence.guild.channels.cache.get(WatchSettings.channel);
            let lastOnl = await guild.client.provider.getUser(newPresence.userID, 'lastOnline')
            if (newPresence.status !== newPresence.member.presence.status) {
                if (WatchSettings.role) {
                    let role = guild.roles.cache.get(WatchSettings.role)
                    if (role) {
                        if (role.mentionable) rolemention = `<@&${role.id}>`;
                        else rolemention = `Unable to mention \`${role.name}\` role`;
                    }
                }
                if (newPresence.status !== 'offline' && newPresence.member.presence.status === 'offline') {
                    lastOnl = Date.now();
                    status = `<@${newPresence.userID}> (${newPresence.user.tag} - ${newPresence.userID}) is OFFLINE <:stt_offline:802747612947283998>`;

                }
                if (newPresence.status === 'offline' && newPresence.member.presence.status === 'online') {
                    let offlineTime = Date.now() - lastOnl;
                    if (!lastOnl) {
                        status = `<@${newPresence.userID}> (${newPresence.user.tag} - ${newPresence.userID}) is ONLINE <:stt_online:802747721094135828>`;
                    }
                    else {
                        status = `<@${newPresence.userID}> (${newPresence.user.tag} - ${newPresence.userID}) is ONLINE <:stt_online:802747721094135828> (Offline for ${utils.msToHHMMSS(offlineTime)})`;
                        lastOnl = undefined;
                    }
                }

                if (WatchSettings.mode == 'all' || (WatchSettings.mode == 'specific' && WatchSettings.list.watch.includes(newPresence.userID))) {
                    if (channel) channel.send(`${status}\n${rolemention}`)
                }

                await guild.client.provider.setUser(newPresence.userID, 'lastOnline', lastOnl)
            }
        }
    } catch (err) {
        // Do nothing here
    }

};

