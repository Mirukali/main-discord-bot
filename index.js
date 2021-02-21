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

mysql.createConnection({
	host: MYSQL_HOST,
	user: MYSQL_USERNAME,
	password: MYSQL_PASSWORD,
	database: MYSQL_DATABASE
}).then((db) => {
    console.log('Database connected.');
	client.setProvider(new mysqlProvider(db))
})

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

//Get and load command and event list.
client.commands = new Discord.Collection();
client.events = new Discord.Collection();

fs.readdir("./events/", (err, files) => {
    if (err) return console.error(err);
    files.forEach(file => {
        // If the file is not a JS file, ignore it (thanks, Apple)
        if (!file.endsWith(".js")) return;
        // Load the event file itself
        const event = require(`./events/${file}`);
        // Get just the event name from the file name
        let eventName = file.split(".")[0];
        // super-secret recipe to call events with all their proper arguments *after* the `client` var.
        // without going into too many details, this means each event will be called with the client argument,
        // followed by its "normal" arguments, like message, member, etc etc.
        // This line is awesome by the way. Just saying'.
        client.on(eventName, event.bind(null, client));
        client.events.set(eventName, event);
        console.log(`Loaded event ${eventName}`);
        delete require.cache[require.resolve(`./events/${file}`)];
    });
});