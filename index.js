// Require part
require('module-alias/register')
require("dotenv").config();
const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const MongoProvider = require('./util/MongoProvider');
const fs = require('fs');
const path = require('path');
const { TOKEN, PREFIX } = process.env;
const command_group = require('./config/command_group');
const exec = require('child_process').exec;

const client = global.client = new Commando.Client({
    commandPrefix: PREFIX,
    owner: ['289018503606960128', '337071802373242892'],
    invite: 'https://discord.gg/8yfv46W',
    ws: {
        intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_PRESENCES', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'DIRECT_MESSAGE_TYPING', 'GUILD_BANS', 'GUILD_EMOJIS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGE_TYPING', 'GUILD_VOICE_STATES', 'GUILD_WEBHOOKS', 'GUILD_INVITES', 'GUILD_INTEGRATIONS']
    },
    partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],

});

new Commando.FriendlyError(
    'Please contact Owner: lexson270400@gmail.com'
);

client.login(TOKEN);

client.on("warn", (e) => console.warn(e));
client.on('error', (...x) => console.error('[CLIENT ERROR]', ...x));
client.ws.on('close', (...x) => log('[WS CLOSE]', ...x));

// Register command group
client.registry
    .registerDefaultTypes()
    .registerDefaultGroups()
    .registerDefaultCommands({
        help: true,
        prefix: true,
        eval: true,
        ping: true,
        commandState: true,
        unknownCommand: false,
    });
client.registry.registerGroups(command_group);
client.registry.registerCommandsIn(path.join(__dirname + '/commands'));

client.setProvider(new MongoProvider());

//Get and load event list.
client.events = new Discord.Collection();

fs.readdir("./events/", (err, files) => {
    if (err) return console.error(err);
    files.forEach(file => {
        if (!file.endsWith(".js")) return;
        // Load the event file itself
        const event = require(`./events/${file}`);
        let eventName = file.split(".")[0];
        client.on(eventName, event.bind(null, client));
        client.events.set(eventName, event);
        console.log(`Loaded event ${eventName}`);
        delete require.cache[require.resolve(`./events/${file}`)];
    });
});

// Automatic check update from repository every 30s.
setInterval(() => {
    exec(`git pull`, (error, stdout) => {
        let response = (error || stdout);
        if (!error) {
            if (response.includes("Already up to date.")) {
                //console.log('Bot already up to date. No changes since last pull')
            } else {
                client.channels.cache.get('594803017249718282').send('**[AUTOMATIC]** \nNew update on GitHub. Pulling. \n\nLogs: \n```' + response + "```" + "\n\n\n**Restarting bot**")
                setTimeout(() => {
                    process.exit();
                }, 1000)
            };
        }
    })
}, 30000)