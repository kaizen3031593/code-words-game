const output = document.getElementById('output');
const message = document.getElementById('message');
const send = document.getElementById('send');
const feedback = document.getElementById('feedback');
const roomMessage = document.getElementById('room-message');
const redUsers = document.getElementById('users-red');
const blueUsers = document.getElementById('users-blue');

const socket = io.connect();

//Fetch URL Params from URL
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const username = urlParams.get('username');
const roomname = urlParams.get('roomname');
console.log(username, roomname);

// Dictionary of all prompts to their functions.
prompts = {
    "/help": getHelp,
    "/stats": getStats,
    "/stats time": getStats,
    "/stats superhero": getStats,
    "/stats sidekick": getStats, 
}

/**
 * Determine which statistics function was requested and ask for it from the server.
 * 
 * @param {string} command The command key to use.
 */
function getStats(command){
    var request = "record";
    if(command.length > 1){
        if(command[1] === "time" || command[1] === "superhero" || command[1] === "sidekick"){
            request = command[1];
        } else {
            socket.emit('chat', {
                username: username,
                message: command.join(" "),
                roomname: roomname,
                event: "chat",
            })
            return;
        }
    }
    socket.emit('get-statistics', {
        username: username,
        roomname: roomname,
        request: request,
    })
}

/**
 * Ask for available commands.
 */
function getHelp(){
    socket.emit('chat', {
        username: username,
        message: Object.keys(prompts).join("<br>"),
        roomname: roomname,
        event: "help",
    })
}

/**
 * Send a random animal.
 */
function getAnimal(){
    socket.emit('chat', {
        username: username,
        message: randomAnimal(),
        color: randomColor(),
        roomname: roomname,
        event: "animal",
    })
}

function randomAnimal(){
    const animals = ["hippo", "cat", "otter", "crow", "kiwi-bird", "spider", "fish", "frog", "dog", "horse", "dragon"];
    return `fas fa-${getRandomElement(animals)}`;
}

function randomColor(){
    const colors = ["text-primary", "text-secondary", "text-success", "text-danger", "text-warning", "text-info"];
    return getRandomElement(colors);
}

function getRandomElement(items){
    return items[Math.floor(Math.random() * items.length)];
}

// Display the roomname the user is connected to.
roomMessage.innerHTML = `${roomname} Chat`;

/**
 * Emitting username and roomname of newly joined user to server.
 */
socket.emit('joined-user', {
    username: username,
    roomname: roomname,
})

/**
 * Sending data when user clicks send.
 */
send.addEventListener('click', () =>{
    var isPrompt = false;
    if (message.value[0] === "/"){
        const components = message.value.split(' ');
        if(components[0] in prompts){
            isPrompt = true;
            prompts[components[0]](components);
        }
        if(components[0] === "/animal"){
            isPrompt = true;
            getAnimal();
        }
    }
    if (!isPrompt && message.value !==""){
        socket.emit('chat', {
            username: username,
            message: message.value,
            roomname: roomname,
            event: "chat",
        })
    }
    message.value = "";
})

/**
 * Allow the enter key to send a message.
 */
window.addEventListener('keypress', function(e){
    if(e.key === "Enter" && message.value !== ""){
        document.getElementById('send').click();
    }
})

/**
 * Sending username if the user is typing.
 */
message.addEventListener('keypress', () => {
    socket.emit('typing', {
        username: username, 
        roomname: roomname
    })
})

/**
 * Displaying if new user has joined the room.
 */
socket.on('joined-user', (data)=>{
    output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>has Joined the Room</em></p>';
    document.getElementById('chat-message').scrollTop = document.getElementById('chat-message').scrollHeight;
})

/**
 * Displaying if a user disconnects from the room.
 */
socket.on('disconnected-user', (data)=>{
    output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>has Left the Room</em></p>';
    document.getElementById('chat-message').scrollTop = document.getElementById('chat-message').scrollHeight;
})

/**
 * Display all possible messages that are sent to the chat window.
 */
socket.on('chat', (data) => {
    if (data.forUser && data.forUser !== username){
        return;
    }
    switch(data.event){
        case "button":
            output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>clicked ' + data.message + '</em></p>';
            break;
        case "disconnected":
            output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>has Left the Room</em></p>';
            break;
        case "joined":
            output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>has Joined the Room</em></p>';
            break;
        case "new":
            output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>created a ' + data.message + '</em></p>';
            break;
        case "switch-team":
            output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>switched to the ' + data.message + '</em></p>';
            break;
        case "switch":
            output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>switched to ' + data.message + '</em></p>';
            break;
        case "wordset":
            output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>changed word sets to ' + setTranslate[data.message] + '</em></p>';
            break;
        case "time":
            output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>changed timer to ' + data.message + ' seconds </em></p>';
            break;
        case "notime":
            output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>turned timer off </em></p>';
            break;
        case "game-won":
            output.innerHTML += '<p>--> <strong><em>' + data.message + ' </strong></em></p> <hr>';
            break;
        case "clue":
            output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>sent the clue ' + data.message + '</em></p>';
            break;
        case "all-roles":
            output.innerHTML += '<p class="text-success"><strong>CryptoNight Role Selection Helper:</strong></p>';
            data.message.forEach(m => {
                if (m.role){
                    output.innerHTML += '<p class="text-success">--> <strong><em>' + m.username + ' </strong>is currently the ' + m.team + ' sidekick</em></p>';
                } else {
                    output.innerHTML += '<p class="text-success">--> <strong><em>' + m.username + ' </strong>is currently the ' + m.team + ' superhero</em></p>';
                }
            })
            break;
        case "chat":
            output.innerHTML += '<p><strong>' + data.username + '</strong>: ' + data.message + '</p>';
            feedback.innerHTML = '';
            break;
        case "help":
            output.innerHTML += '<p class="text-success"><strong>CryptoNight Command Helper:</strong></p>';
            output.innerHTML += `<p class="text-success"><strong>${data.message}</strong></p>`;
            feedback.innerHTML = '';
            break;
        case "stats":
            output.innerHTML += `<p class="text-success"><strong>CryptoNight Statistics:</strong></p>`;
            output.innerHTML += data.message;
            feedback.innerHTML = '';
            break; 
        case "animal":
            output.innerHTML += `<p
                                <span class="${data.color}" style="font-size: 5em;">
                                    <i class="${data.message}"></i>
                                </span>
                                </p>`;
            feedback.innerHTML = '';
            break;
        case "randomize":
            output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>randomized teams and roles</em></p>';
            output.innerHTML += `<p class="text-danger"><strong>${data.redSuperhero} is the Red Superhero</strong></p>`;
            output.innerHTML += `<p class="text-danger"><strong>${data.redSidekick} is the Red Sidekick</strong></p>`;
            output.innerHTML += `<p class="text-primary"><strong>${data.blueSuperhero} is the Blue Superhero</strong></p>`;
            output.innerHTML += `<p class="text-primary"><strong>${data.blueSidekick} is the Blue Sidekick</strong></p>`;
            break;
    }
    document.getElementById('chat-message').scrollTop = document.getElementById('chat-message').scrollHeight;
})

/**
 * Displaying if a user is typing.
 */
socket.on('typing', (user) => {
    feedback.innerHTML = '<p><em>' + user + ' is typing...</em></p>';
})

/**
 * Displaying online users.
 */
socket.on('online-users', (data) =>{
    // Clear anything previous.
    redUsers.innerHTML = "";
    blueUsers.innerHTML = "";

    data.forEach(user => {
        // Create card
        let card = document.createElement('h5'); 
        card.className = "w-100 border rounded text-center mx-auto grabbable";
        card.innerHTML = `${user.username}`;
        // Only can drag card that corresponds to the current user.
        if (user.username !== username){
            card.classList.add("filtered");
        }
        card.id = user.username;
        card.style = "cursor: pointer;"
        if (user.team === "red"){
            card.classList.add("border-danger");
            card.classList.add("text-danger");
            redUsers.appendChild(card);
        } else {
            card.classList.add("border-primary");
            card.classList.add("text-primary");
            blueUsers.appendChild(card);
        }
    });
})

/**
 * Checking if user refreshed and updating session storage.
 */
socket.on('check-refresh', (data) =>{
    if(data.username === username){
        if(sessionStorage.getItem('refresh')) {
            // not first visit, so refreshed
            console.log('refreshed');
            sessionStorage.setItem('restore','1');
            console.log('onrefresh', sessionStorage.getItem('restore'));
        } else {
            sessionStorage.setItem('refresh', '1');
            console.log('first time');
            socket.emit('join-message', {
                username: data.username, 
                roomname: data.roomname,
            })
        }
    }
})
