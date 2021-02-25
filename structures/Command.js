const { Command } = require('discord.js-commando');

class MCCommand extends Command {
    constructor(client, info){
        super(client, info);

        this.argsSingleQuotes = info.argsSingleQuotes || false;
        this.throttling = info.unknown ? null : info.throttling || { usages: 1, duration: 2 };
		this.uses = 0;
    }
}

module.exports = MCCommand;