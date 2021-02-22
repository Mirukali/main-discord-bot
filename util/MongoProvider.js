const mongodb = require('mongodb');
const Commando = require('discord.js-commando');
const { MONGO_HOST, MONGO_USERNAME, MONGO_PASSWORD, MONGO_PORT, NODE_ENV } = process.env;
const guildsettingskeys = require('../config/defaultServerSettings.json');
const usersettingskeys = require('../config/defaultUserSettings.json');
const botsettingskeys = require('../config/defaultBotSettings.json');

class CustomProvider extends Commando.SettingProvider {
    constructor() {
        super();

        this.url = `mongodb://${encodeURIComponent(MONGO_USERNAME)}:${encodeURIComponent(MONGO_PASSWORD)}@${encodeURIComponent(MONGO_HOST)}:${encodeURIComponent(MONGO_PORT)}/?authMechanism=DEFAULT&authSource=admin`;
        Object.defineProperty(this, 'client', { value: null, writable: true });
        this.guildSettings = new Map();
        this.userSettings = new Map();
        this.botSettings = new Map();
        this.listeners = new Map();
        this.isReady = false;
    }
    async init(client) {
        try {
            this.dbClient = await mongodb.MongoClient.connect(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
            console.log('Connected to mongodb with mongodb');
        }
        catch (err) {
            console.log(err);
            process.exit(-1);
        }

        this.client = client;

        if (NODE_ENV === 'development') {
            this.db = this.dbClient.db('beta');
        } else {
            this.db = this.dbClient.db('bot');
        }
        const guildSettingsCollection = this.db.collection('Guilds');
        const { guildSettings } = this;
        const userSettingsCollection = this.db.collection('Users');
        const { userSettings } = this;
        const botSettingsCollection = this.db.collection('Bot');
        const { botSettings } = this;

        await guildSettingsCollection.createIndex('guildID', { unique: true });
        await userSettingsCollection.createIndex('userID', { unique: true });
        await botSettingsCollection.createIndex('botconfs', { unique: true });

        /* eslint guard-for-in: 0 */
        for (const guild in client.guilds.cache.array()) {
            try {
                const result = await guildSettingsCollection.findOne({ guildID: client.guilds.cache.array()[guild].id });
                let settings;

                if (!result) {
                    // Can't find DB make new one.
                    settings = guildsettingskeys;
                    guildSettingsCollection.insertOne({ guildID: client.guilds.cache.array()[guild].id, settings });
                }
                if (result && result.settings) {
                    settings = result.settings;
                }

                guildSettings.set(client.guilds.cache.array()[guild].id, settings);
            }
            catch (err) {
                console.warn(`Error while creating document of guild ${client.guilds.cache.array()[guild].id}`);
                console.warn(err);
            }
        }

        try {
            const result = await guildSettingsCollection.findOne({ guildID: 'global' });
            let settings;

            if (!result) {
                // Could not load global, do new one
                settings = {};
                guildSettingsCollection.insertOne({ guildID: 'global', settings });
                this.setupGuild('global', settings);
            }

            if (result && result.settings) {
                settings = result.settings;
            }
            guildSettings.set('global', settings);
        }
        catch (err) {
            console.warn('Error while creating guild global document');
            console.warn(err);
        }

        for (const user in client.users.cache.array()) {
            try {
                const result = await userSettingsCollection.findOne({ userID: client.users.cache.array()[user].id });
                let settings;

                if (!result) {
                    // Can't find DB make new one.
                    settings = usersettingskeys;
                    userSettingsCollection.insertOne({ userID: client.users.cache.array()[user].id, settings });
                }
                if (result && result.settings) {
                    settings = result.settings;
                }
                userSettings.set(client.users.cache.array()[user].id, settings);
            }
            catch (err) {
                console.warn(`Error while creating document of user ${client.users.cache.array()[user].id}`);
                console.warn(err);
            }
        }

        try {
            const result = await userSettingsCollection.findOne({ userID: 'global' });
            let settings;

            if (!result) {
                // Could not load global, do new one
                settings = {};
                userSettingsCollection.insertOne({ userID: 'global', settings });
            }
            if (result && result.settings) {
                settings = result.settings;
            }
            userSettings.set('global', settings);
        }
        catch (err) {
            console.warn('Error while creating user global document');
            console.warn(err);
        }

        try {
            const result = await botSettingsCollection.findOne({ botconfs: 'botconfs' });
            let settings;

            if (!result) {
                // Can't find DB make new one.
                settings = botsettingskeys;
                botSettingsCollection.insertOne({ botconfs: 'botconfs', settings });
            }
            if (result && result.settings) {
                settings = result.settings;
            }
            botSettings.set('botconfs', settings);
        }
        catch (err) {
            console.warn('Error while creating document of botconfs');
            console.warn(err);
        }

        try {
            const result = await botSettingsCollection.findOne({ botconfs: 'global' });
            let settings;

            if (!result) {
                // Could not load global, do new one
                settings = {};
                botSettingsCollection.insertOne({ botconfs: 'global', settings });
            }
            if (result && result.settings) {
                settings = result.settings;
            }

            botSettings.set('global', settings);
        }
        catch (err) {
            console.warn('Error while creating botconfs global document');
            console.warn(err);
        }

        this.isReady = true;

        if (this.readyCallback) {
            this.readyCallback();
        }

        this.listeners
            .set('commandPrefixChange', (guild, prefix) => this.set(guild, 'prefix', prefix))
            .set('commandStatusChange', (guild, command, enabled) => this.set(guild, `cmd-${command.name}`, enabled))
            .set('groupStatusChange', (guild, group, enabled) => this.set(guild, `grp-${group.id}`, enabled))
            .set('guildCreate', (guild) => {
                const settings = this.guildSettings.get(guild.id);
                if (!settings) return;
                this.setupGuild(guild.id, settings);
            })
            .set('commandRegister', (command) => {
                for (const [guild, settings] of this.guildSettings) {
                    if (guild !== 'global' && !client.guilds.cache.has(guild)) continue;
                    this.setupGuildCommand(client.guilds.cache.get(guild), command, settings);
                }
            })
            .set('groupRegister', (group) => {
                for (const [guild, settings] of this.guildSettings) {
                    if (guild !== 'global' && !client.guilds.cache.has(guild)) continue;
                    this.setupGuildGroup(client.guilds.cache.get(guild), group, settings);
                }
            });
        for (const [event, listener] of this.listeners) client.on(event, listener);
    }

    destroy() {
        // Remove all listeners from the client
        for (const [event, listener] of this.listeners) this.client.removeListener(event, listener);
        this.listeners.clear();
    }

    // Guild method
    async fetchGuild(guildID, key) {
        let settings = this.guildSettings.get(guildID);

        if (!settings) {
            const result = await this.db.collection('Guilds').findOne({ guildID: guildID });

            if (result && result.settings) {
                settings = result.settings;
            }
        }

        if (key) {
            return settings[key];
        }

        return settings;
    }

    getGuild(guild, key, defVal) {
        const settings = this.guildSettings.get(this.constructor.getGuildID(guild));

        if (!key && !defVal) {
            return settings;
        }

        return settings ? typeof settings[key] === 'undefined' ? defVal : settings[key] : defVal;
    }

    async setGuildComplete(guild, val) {
        guild = this.constructor.getGuildID(guild);
        this.guildSettings.set(guild, val);

        const settingsCollection = this.db.collection('Guilds');

        await settingsCollection.updateOne({ guildID: guild }, { $set: { settings: val } });
        return val;
    }

    async setGuild(guild, key, val) {
        guild = this.constructor.getGuildID(guild);
        let settings = this.guildSettings.get(guild);
        if (!settings) {
            settings = {};
            this.guildSettings.set(guild, settings);
        }

        settings[key] = val;
        const settingsCollection = this.db.collection('Guilds');

        await settingsCollection.updateOne({ guildID: guild }, { $set: { settings } });
        return val;
    }

    async removeGuild(guild, key, val) {
        guild = this.constructor.getGuildID(guild);
        let settings = this.guildSettings.get(guild);
        if (!settings) {
            settings = {};
            this.guildSettings.set(guild, settings);
        }

        val = settings[key];
        settings[key] = undefined;
        const settingsCollection = this.db.collection('Guilds');

        await settingsCollection.updateOne(
            { guildID: guild },
            { $set: { settings } }
        );
        return val;
    }

    async clearGuild(guild) {
        guild = this.constructor.getGuildID(guild);

        if (!this.guildSettings.has(guild)) return;

        this.guildSettings.delete(guild);
        const settingsCollection = this.db.collection('Guilds');
        await settingsCollection.deleteOne({
            guildID: guild
        });
    }

    // User method
    async fetchUser(userID, key) {
        let settings = this.userSettings.get(userID);

        if (!settings) {
            const result = await this.db.collection('Users').findOne({ userID: userID });

            if (result && result.settings) {
                settings = result.settings;
            }
        }

        if (key) {
            return settings[key];
        }

        return settings;
    }

    async setUserComplete(user, val) {
        let settings = this.userSettings.get(user);
        if (!settings) {
            settings = {};
            this.userSettings.set(user, settings);
        }

        const settingsCollection = this.db.collection('Users');

        await settingsCollection.updateOne({ userID: user }, { $set: { settings: val } });
        return val;
    }

    async setUser(user, key, val) {
        let settings = this.userSettings.get(user);
        if (!settings) {
            settings = {};
            this.userSettings.set(user, settings);
        }

        settings[key] = val;
        const settingsCollection = this.db.collection('Users');

        await settingsCollection.updateOne({ userID: user }, { $set: { settings } });
        return val;
    }

    async removeUser(user, key, val) {
        let settings = this.userSettings.get(user);
        if (!settings) {
            settings = {};
            this.userSettings.set(user, settings);
        }

        val = settings[key];
        settings[key] = undefined;
        const settingsCollection = this.db.collection('Users');

        await settingsCollection.updateOne(
            { userID: user },
            { $set: { settings } });
        return val;
    }

    async clearUser(user) {
        if (!this.settings.has(user)) return;
        this.settings.delete(user);
        const settingsCollection = this.db.collection('Users');
        await settingsCollection.deleteOne({
            userID: user
        });
    }

    getUser(user, key, defVal) {
        const settings = this.userSettings.get(user);

        if (!key && !defVal) {
            return settings;
        }

        return settings ? typeof settings[key] === 'undefined' ? defVal : settings[key] : defVal;
    }

    // Bot method
    async fetchBotSettings(index, key, key2) {
        const result = await this.db.collection('Bot').findOne({ botconfs: index });

        let settings;

        if (result && result.settings) {
            settings = result.settings;
        }

        if (key && !key2) {
            return settings[key];
        }

        if (key2) {
            return settings[key][key2];
        }
        return settings;
    }

    async setBotconfsComplete(botconfs, val) {
        let settings = this.botSettings.get('botconfs');
        if (!settings) {
            settings = {};
            this.botSettings.set('botconfs', settings);
        }

        const settingsCollection = this.db.collection('Bot');

        await settingsCollection.updateOne({ botconfs }, { $set: { settings: val } });
        return val;
    }

    async setBotsettings(index, key, val) {
        let settings = this.botSettings.get(index);
        if (!settings) {
            settings = {};
        }

        settings[key] = val;
        const settingsCollection = this.db.collection('Bot');

        await settingsCollection.updateOne({ botconfs: index }, { $set: { settings } });
        return val;
    }

    async removeBotsettings(index, key, val) {
        let settings = this.botSettings.get(index);
        if (!settings) {
            settings = {};
        }

        val = settings[key];
        delete settings[key];
        const settingsCollection = this.db.collection('Bot');

        await settingsCollection.updateOne({ botconfs: index }, { $set: { settings } });
        return val;
    }


    async clearBotsettings(index) {
        const settingsCollection = this.db.collection('Bot');
        await settingsCollection.deleteOne({
            botconfs: index
        });
    }

    getBotsettings(index, key, defVal) {
        const settings = this.botSettings.get(index);

        if (!key && !defVal) {
            return settings;
        }

        return settings ? typeof settings[key] === 'undefined' ? defVal : settings[key] : defVal;
    }

    async reloadBotSettings() {
        try {
            const result = await this.db.collection('Bot').findOne({ botconfs: 'botconfs' });
            let settings;

            if (!result) {
                // Can't find DB make new one.
                settings = botsettingskeys;
                await this.db.collection('Bot').insertOne({ botconfs: 'botconfs', settings });
            }

            if (result && result.settings) {
                settings = result.settings;
            }

            await this.db.collection('Bot').updateOne({ botconfs: 'botconfs' }, { $set: { settings } });

            this.botSettings.set('botconfs', settings);
        }
        catch (err) {
            console.warn('Error while creating document of bot settings');
            console.warn(err);
        }
    }

    async reloadGuild(id, type, value) {
        try {
            const result = await this.db.collection('Guilds').findOne({ guildID: id });
            let settings;

            if (!result) {
                // Can't find DB make new one.
                settings = guildsettingskeys;
                await this.db.collection('Guilds').insertOne({ guildID: id, settings });
            }

            if (result && result.settings) {
                settings = result.settings;
            }

            await this.db.collection('Guilds').updateOne({ guildID: id }, { $set: { settings } });

            if (type === 'prefix') {
                const guild = this.client.guilds.cache.get(id) || null;
                guild._commandPrefix = value;
            }

            this.guildSettings.set(id, settings);
        }
        catch (err) {
            console.warn(`Error while creating document of guild ${id}`);
            console.warn(err);
        }
    }

    async reloadUser(id) {
        try {
            const result = await this.db.collection('Users').findOne({ userID: id });
            let settings;

            if (!result) {
                // Can't find DB make new one.
                settings = usersettingskeys;
                await this.db.collection('Users').insertOne({ userID: id, settings });
            }

            if (result && result.settings) {
                settings = result.settings;
            }

            await this.db.collection('Users').updateOne({ userID: id }, { $set: { settings } });

            this.userSettings.set(id, settings);
        }
        catch (err) {
            console.warn(`Error while creating document of user ${id}`);
            console.warn(err);
        }
    }

    /**
       * Sets the guild up in the db for usage.
       * @param {snowflake} guildID
       * @param {object containing properties} settings
       */
    setupGuild(guild, settings) {
        if (typeof guild !== 'string') throw new TypeError('The guild must be a guild ID or "global".');
        guild = this.client.guilds.cache.get(guild) || null;

        // Load the command prefix
        if (typeof settings.prefix !== 'undefined') {
            if (guild) guild._commandPrefix = settings.prefix;
            else this.client._commandPrefix = settings.prefix;
        }

        // Load all command/group statuses
        for (const command of this.client.registry.commands.values()) this.setupGuildCommand(guild, command, settings);
        for (const group of this.client.registry.groups.values()) this.setupGuildGroup(guild, group, settings);
    }

    setupGuildCommand(guild, command, settings) {
        if (typeof settings[`cmd-${command.name}`] === 'undefined') return;
        if (guild) {
            if (!guild._commandsEnabled) guild._commandsEnabled = {};
            guild._commandsEnabled[command.name] = settings[`cmd-${command.name}`];
        }
        else {
            command._globalEnabled = settings[`cmd-${command.name}`];
        }
    }

    setupGuildGroup(guild, group, settings) {
        if (typeof settings[`grp-${group.id}`] === 'undefined') return;
        if (guild) {
            if (!guild._groupsEnabled) guild._groupsEnabled = {};
            guild._groupsEnabled[group.id] = settings[`grp-${group.id}`];
        }
        else {
            group._globalEnabled = settings[`grp-${group.id}`];
        }
    }

    // Another method
    getDatabase() {
        return this.db;
    }

    whenReady(callback) {
        this.readyCallback = callback;
    }
    getBotCollection() {
        return this.db.collection('Bot');
    }
    getUserCollection() {
        return this.db.collection('Users');
    }
    getGuildCollection() {
        return this.db.collection('Guilds')
    }
    async getUserSetting(userID) {
        const settings = await this.db.collection('Users').find({ userID: userID }).project({ settings: 1 })
        return settings;
    }
    async getServerSetting(serverID) {
        const settings = await this.db.collection('Servers').find({ userID: serverID }).project({ settings: 1 })
        return settings;
    }
    async getBotSetting(index) {
        const settings = await this.db.collection('Bots').find({ botconfs: index }).project({ botconfs: 1 })
        return settings;
    }
    initUserMap(userID){
        let settings = this.userSettings.get(userID);
        if (!settings) {
            settings = {};
            this.userSettings.set(userID, settings);
        }
        return setting;
    }
    initGuildMap(serverID){
        let settings = this.guildSettings.get(serverID);
        if (!settings) {
            settings = {};
            this.guildSettings.set(serverID, settings);
        }
        return setting;
    }
    initBotMap(index){
        let settings = this.botSettings.get(index);
        if(!settings){
            settings = {};
            this.botSettings.set(index, settings);
        }
        return this.botSettings.get(index);
    }
}

module.exports = CustomProvider;