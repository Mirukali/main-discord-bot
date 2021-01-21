const SettingProvider = require('discord.js-commando').SettingProvider;
const { User } = require('discord.js');

/**
    * Uses an MySQL database to store settings with guilds
    * @extends {SettingProvider}
    */
class MySQLProvider extends SettingProvider {
    constructor(db) {
        super();

        this.db = db;

        Object.defineProperty(this, 'client', { value: null, writable: true })

        /**
         * Settings cached in memory, mapped by guild ID (or 'global')
         * @type {Map}
         * @private
         */
        this.settings = new Map();

        /**
         * User Settings cached in memory, Mapped by user ID
         * @type {Map}
         * @private
         */
        this.users = new Map();

        /**
         * Global bot settings in memory
         * @type {Map}
         * @private
         */
        this.botSettings = new Map();
        /**
         * Listeners on the Client, mapped by the event name
         * @type {Map}
         * @private
         */
        this.listeners = new Map();

        this.isReady = false;
    }

    async init(client) {
        this.client = client;

        // Settings
        await this.db.execute('CREATE TABLE IF NOT EXISTS `settings` (`guild` VARCHAR(250) NOT NULL, `settings` LONGTEXT NOT NULL , PRIMARY KEY (`guild`))')

        // Load all settings
        const settingRows = await this.db.execute('SELECT guild, settings FROM settings').then((res) => res[0]);
        for (const settingRow of settingRows) {
            let settings
            try {
                settings = JSON.parse(settingRow.settings)
            } catch (err) {
                client.emit('warn', `MySQLProvider couldn't parse the settings stored for guild ${settingRow.guild}.`);
                continue
            }

            const guild = settingRow.guild !== '0' ? settingRow.guild : 'global';
            this.settings.set(guild, settings)

            if (guild !== 'global' && !client.guilds.cache.has(settingRow.guild)) { continue }

            this.setupGuild(guild, settings)

        }

        // User settings
        await this.db.execute('CREATE TABLE IF NOT EXISTS `users` (`user` VARCHAR(250) NOT NULL, `settings` LONGTEXT NOT NULL , PRIMARY KEY (`user`))')

        const userRows = await this.db.execute('SELECT user, settings FROM users').then((res) => res[0]);
        for (const userRow of userRows) {
            let userSettings
            try {
                userSettings = JSON.parse(userRow.settings)
            } catch (err) {
                client.emit('warn', `MySQLProvider couldn't parse the settings stored for User ${userRow.user}.`);
                continue
            }

            const user = userRow.user ;
            this.users.setUser(user, userSettings);

            if (!client.users.cache.has(userRow.user)) { continue }

        }

        // Bot settings
        await this.db.execute('CREATE TABLE IF NOT EXISTS `botconfs` (`indexkey` VARCHAR(250) NOT NULL, `settings` LONGTEXT NOT NULL , PRIMARY KEY (`index`))')

        const indexRows = await this.db.execute('SELECT indexkey, settings FROM botconfs').then((res) => res[0]);
        for (const indexRow of indexRows){
            let botSettings
            try {
                botSettings = JSON.parse(indexRow.settings)
            } catch (err) {
                client.emit('warn', `MySQLProvider couldn't parse the settings stored for Index ${userRow.indexkey}.`);
                continue
            }

            const index = indexRow.indexkey;
            this.botSettings.setBotSettings(index, botSettings)

        }

        this.isReady = true;

        // Listen for changes
        this.listeners
            .set('commandPrefixChange', (guild, prefix) => {
                this.set(guild, 'prefix', prefix)
            })
            .set('commandStatusChange', (guild, command, enabled) => {
                this.set(guild, `cmd-${command.name}`, enabled)
            })
            .set('groupStatusChange', (guild, group, enabled) => {
                this.set(guild, `grp-${group.id}`, enabled)
            })
            .set('guildCreate', guild => {
                const settings = this.settings.get(guild.id)
                if (!settings) {
                    return
                }

                this.setupGuild(guild.id, settings)
            })
            .set('commandRegister', command => {
                for (const [guild, settings] of this.settings) {
                    if (guild !== 'global' && !client.guilds.cache.get(guild) || !client.guilds.has(guild)) {
                        continue
                    }

                    this.setupGuildCommand(client.guilds.cache.get(guild) || client.guilds.get(guild), command, settings)
                }
            })
            .set('groupRegister', group => {
                for (const [guild, settings] of this.settings) {
                    if (guild !== 'global' && !client.guilds.cache.get(guild) || !client.guilds.has(guild)) {
                        continue;
                    }

                    this.setupGuildGroup(client.guilds.cache.get(guild) || client.guilds.get(guild), group, settings)
                }
            });

        for (const [event, listener] of this.listeners) {
            client.on(event, listener)
        }
    }

    async destroy() {
        // Remove all listeners from the client
        for (const [event, listener] of this.listeners) {
            this.client.removeListener(event, listener)
        }

        this.listeners.clear()
    }

    async set(guild, key, val) {
        guild = this.constructor.getGuildID(guild)
        let settings = this.settings.get(guild)

        if (!settings) {
            settings = {}
            this.settings.set(guild, settings)
        }

        settings[key] = val;

        await this.db.execute('REPLACE INTO settings VALUES(?, ?)', [guild !== 'global' ? guild : 0, JSON.stringify(settings)])
        if (guild === 'global') {
            this.updateOtherShards(key, val)
        }

        return val;
    }

    async remove(guild, key) {
        guild = this.constructor.getGuildID(guild)
        const settings = this.settings.get(guild)

        if (!settings || typeof settings[key] === 'undefined') {
            return undefined
        }

        const val = settings[key];
        settings[key] = undefined;
        await this.db.execute('REPLACE INTO settings VALUES(?, ?)', [guild !== 'global' ? guild : 0, JSON.stringify(settings)])

        if (guild === 'global') {
            this.updateOtherShards(key, undefined)
        }

        return val
    }

    /**
     * Loads all settings for a guild
     * @param {string} guild - Guild ID to load the settings of (or 'global')
     * @param {Object} settings - Settings to load
     * @private
     */
    setupGuild(guild, settings) {
        if (typeof guild !== 'string') {
            throw new TypeError('The guild must be a guild ID or "global".')
        }

        guild = this.client.guilds.cache.get(guild) || null

        // Load the command prefix
        if (typeof settings.prefix !== 'undefined') {
            if (guild) {
                guild._commandPrefix = settings.prefix
            } else {
                this.client._commandPrefix = settings.prefix
            }
        }

        // Load all command/group statuses
        for (const command of this.client.registry.commands.values()) {
            this.setupGuildCommand(guild, command, settings)
        }

        for (const group of this.client.registry.groups.values()) {
            this.setupGuildGroup(guild, group, settings)
        }
    }

    /**
     * Sets up a command's status in a guild from the guild's settings
     * @param {?Guild} guild - Guild to set the status in
     * @param {Command} command - Command to set the status of
     * @param {Object} settings - Settings of the guild
     * @private
     */
    setupGuildCommand(guild, command, settings) {
        if (typeof settings[`cmd-${command.name}`] === 'undefined') {
            return
        }

        if (guild) {
            if (!guild._commandsEnabled) guild._commandsEnabled = {};
            guild._commandsEnabled[command.name] = settings[`cmd-${command.name}`]
        } else {
            command._globalEnabled = settings[`cmd-${command.name}`]
        }
    }

    /**
     * Sets up a group's status in a guild from the guild's settings
     * @param {?Guild} guild - Guild to set the status in
     * @param {CommandGroup} group - Group to set the status of
     * @param {Object} settings - Settings of the guild
     * @private
     */
    setupGuildGroup(guild, group, settings) {
        if (typeof settings[`grp-${group.id}`] === 'undefined') {
            return
        }

        if (guild) {
            if (!guild._groupsEnabled) guild._groupsEnabled = {}
            guild._groupsEnabled[group.id] = settings[`grp-${group.id}`]
        } else {
            group._globalEnabled = settings[`grp-${group.id}`]
        }
    }

    /**
     * Updates a global setting on all other shards if using the {@link ShardingManager}.
     * @param {string} key - Key of the setting to update
     * @param {*} val - Value of the setting
     * @private
     */
    updateOtherShards(key, val) {
        if (!this.client.shard) {
            return
        }

        key = JSON.stringify(key);
        val = (typeof val !== 'undefined' ? JSON.stringify(val) : 'undefined')

        this.client.shard.broadcastEval(`
			if(this.shard.id !== ${this.client.shard.id} && this.provider && this.provider.settings) {
				this.provider.settings.global[${key}] = ${val}
			}
		`)
    }

    // Custom provider
    // User 

    /**
     * Obtains a setting for a user
     * @param {User} user - User the setting is associated with 
     * @param {string} key - Name of the setting
     * @param {*} val - Value to default to if the setting isn't set on the user
     * @return {*}
     * @abstract
     */
    getUser(user, key, val) {
        const settings = this.users.get(this.constructor.getUserID(user))
        return (settings ? (typeof settings[key] !== 'undefined' ? settings[key] : val) : val)
    }

    /**
     * Sets a setting for a user
     * @param {User} user - User to associate the setting with 
     * @param {string} key - Name of the setting
     * @param {*} val - Value of the setting
     * @return {Promise<*>} New value of the setting
     * @abstract
     */
    async setUser(user, key, val) {
        user = this.constructor.getUserID(user);
        let settings = this.users.getUser(user);

        if (!settings) {
            settings = {}
            this.users.setUser(user, settings)
        }

        settings[key] = val;

        await this.db.execute('REPLACE INTO users VALUES(?, ?)', [user, JSON.stringify(settings)]);
        return val;
    }

    /**
     * Removes a setting from an user
     * @param {User} user - User the setting is associated with 
     * @param {string} key - Name of the setting
     * @return {Promise<*>} Old value of the setting
     * @abstract
     */
    async removeUser(user, key) {
        user = this.constructor.getUserID(user);
        const settings = this.users.getUser(user);

        if (!settings || typeof settings[key] === 'undefined') {
            return undefined
        }

        const val = settings[key];
        settings[key] = undefined;
        await this.db.execute('REPLACE INTO users VALUES(?, ?)', [user, JSON.stringify(settings)])

        return val;
    }

    /**
     * Removes all settings of an user
     * @param {User} user - User to clear the settings of
     * @return {Promise<void>}
     * @abstract
     */
    async clearUser(user) {
        user = this.constructor.getUserID(user);
        if (!this.users.has(user)) return;

        this.users.delete(user);
        await this.db.execute('DELETE FROM users WHERE guild = ?', [user]);
    }

    /**
     * Obtains the ID of the provided user, or throws an error if it isn't valid
     * @param {User} guild - User to get the ID of
     * @return {string} ID of the user
     */
    static getUserID(user) {
        if (user instanceof User) return user.id;
        if (typeof user == 'string' && !isNaN(user)) return user;
        throw new TypeError('Invalid guild specified. Must be a User instance, user ID.');
    }

    // Bot settings
    getBotSettings(index, key, val) {
        const settings = this.botSettings.get(index);
        if (!key && !val) return index;

        return settings ? typeof settings[key] === 'undefined' ? val : settings[key] : val;
    }

    async setBotSettings(index, key, val) {
        settings = this.botSettings.get(index);
        if (!settings) {
            settings = {};
        }

        settings[key] = val;

        await this.db.execute('REPLACE INTO botconfs VALUES(?, ?)', [index, JSON.stringify(settings)]);
        return val;
    }

    async removeBotSettings(index, key) {
        settings = this.botSettings.get(index);
        if (!settings) {
            settings = {};
        }

        const val = settings[key];
        settings[key] = undefined;

        await this.db.execute('REPLACE INTO botconfs VALUES(?, ?)', [index, JSON.stringify(settings)])
        return val;
    }

    async clearBotSetting(index) {
        if (!this.bots.has(index)) return;

        this.bots.delete(index);
        await this.db.execute('DELETE FROM botconfs WHERE indexkey = ?', [index]);
    }

    // Other
    getDatabase() {
        return this.db;
    }

    async reloadGuildSettings(guild) {
        try {
            // const settingRows = await this.db.execute('SELECT guild, settings FROM settings').then((res) => res[0]);

            const result = await this.db.execute('SELECT guild, settings FROM settings WHERE guild = ?', [guild]).then((res) => res[0]);
            let settings;

            if (!result) {
                settings = {};
                await this.db.execute('REPLACE INTO settings VALUES(?, ?)', [guild !== 'global' ? guild : 0, JSON.stringify(settings)]);
            }

            if (result && result.settings) {
                settings = result.settings;
            }

            this.settings.set(guild, settings)
        } catch (err) {
            console.warn(`Error while creating data of guild ${guild}`);
            console.warn(err);
        }
    }

    async reloadUserSettings(user){
        try {
            const result = await this.db.execute('SELECT user, settings FROM users WHERE user = ?', [user]).then((res) => res[0]);
            let settings;

            if (!result) {
                settings = {};
                await this.db.execute('REPLACE INTO users VALUES(?, ?)', [user, JSON.stringify(settings)]);
            }

            if (result && result.settings) {
                settings = result.settings;
            }

            this.users.setUser(user, settings)
        } catch (error) {
            console.warn(`Error while creating data of user ${user}`);
            console.warn(err);
        }
    }

    async reloadBotSettings(index){
        try {
            const result = await this.db.execute('SELECT indexkey, settings FROM botconfs WHERE indexkey = ?', [index]).then((res) => res[0]);
            if (!result){
                settings = {};
                await this.db.execute('REPLACE INTO bot onfs VALUES(?, ?)', [index, JSON.stringify(settings)]);
            }

            if (result && result.settings) {
                settings = result.settings;
            }

            this.botSettings.setBotSettings(index, settings)
        } catch (error) {
            
        }
    }
}
module.exports = MySQLProvider;