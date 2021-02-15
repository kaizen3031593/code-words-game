const lobbyBtn = document.getElementById('lobbybtn');
const usernameSpace = document.getElementById('username');
const lobby = document.getElementById('playerlobby');

/**
 * When enter is clicked, validate the username and create an avatar in the player lobby.
 */
lobbyBtn.addEventListener('click', () =>{
    createPlayerAvatar(usernameSpace.value);
})

/**
 * Creates the html required for the player avatar to show up on screen.
 * 
 * @param {string} username The players username
 */
function createPlayerAvatar(username){
    const player = document.createElement('div');
    player.className = 'col';
    player.style = "max-width: 25%";

    const avatar = document.createElement('div');
    avatar.className = "avatar text-center";
    const text = document.createElement('h2');
    text.innerHTML = username;

    avatar.appendChild(text);
    player.appendChild(avatar);
    lobby.appendChild(player);
}