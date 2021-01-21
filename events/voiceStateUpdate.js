module.exports = (client, oldState, newState) => {
    //Declare oldState and newState
    let oldS = oldState; let newS = newState;

    let newUserChannel = newS.channel;
    let oldUserChannel = oldS.channel;

    let newMember = newS.member; let oldMember = oldS.member;
    const trole = '729681119385092148';

    // Add TempVoice in 10 second then remove it.
    function tempRole() {
        newMember.roles.add(trole);
        // Remove temp voice role
        setTimeout(() => {
            newMember.roles.remove(trole);
        }, 10000);
    }

    if (newMember.user.bot || oldMember.user.bot) return;
    // Join voice
    if (oldUserChannel === undefined && newUserChannel !== undefined) {
        tempRole();
    }
    // Leave voice
    else if (newUserChannel === undefined) {
        tempRole();
    }
    // Move a voice channel to another channel
    else {
        tempRole();
    }


}