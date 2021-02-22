const exec = require('child_process').exec;

module.exports = async (client) => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Logged in as ${client.user.id}!`);
    client.user.setActivity(`DM's for help.`, { type: 'WATCHING' })
        .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
        .catch(console.error);
}