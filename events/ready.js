const exec = require('child_process').exec;
process.cwd()

module.exports = async (client) => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Logged in as ${client.user.id}!`);
    client.user.setActivity(`DM's for help.`, { type: 'WATCHING' })
        .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
        .catch(console.error);

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
}