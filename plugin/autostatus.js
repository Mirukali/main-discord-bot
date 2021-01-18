var ss; //
const activities = [{
    "text": "over Mine & Chill",
    "type": "WATCHING"
},
{
    "text": "to me",
    "type": "LISTENING"
},
{
    "text": "DM's for help",
    "type": "WATCHING"
}
];
function StartSet(client) {
    const activity = activities[Math.floor(Math.random() * activities.length)];
    client.user.setActivity(activity.text, {
        type: activity.type
    });
    ss = setInterval(() => {
        const activity = activities[Math.floor(Math.random() * activities.length)];
        client.user.setActivity(activity.text, {
            type: activity.type
        });
    }, 600000);
    console.log('Starting')
}
function StopSet(client) {
    clearInterval(ss);
    client.user.setActivity(`DM's for help.`, { type: 'WATCHING' });
}

module.exports = {
    startstatus: StartSet,
    stopstatus: StopSet,
};