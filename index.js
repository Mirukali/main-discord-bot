// Require part
require("dotenv").config();
const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const mysql = require('mysql2/promise');
const mysqlProvider = require('./structures/SettingsProvider');
const fs = require('fs');
const path = require('path');
const { TOKEN, PREFIX, MYSQL_HOST, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;
const command_group = require('./config/command_group');

const client = global.client = new Commando.Client({
    commandPrefix: PREFIX,
    owner: ['289018503606960128', '337071802373242892'],
    invite: 'https://discord.gg/8yfv46W',
});

new Commando.FriendlyError(
    'Please contact Owner: lexson270400@gmail.com'
);

client.login(TOKEN);

client.on('debug', (...x) => console.info('[DEBUG]', ...x));
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