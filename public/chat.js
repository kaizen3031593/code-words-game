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
prompts = {"/stats": getStats, "/help": getHelp}

// CryptoNight Statistics
function getStats(components){
    console.log(components);
}

// CryptoNight Command Helper
function getHelp(){
    socket.emit('chat', {
        username: username,
        forUser: username,
        message: Object.keys(prompts).join("&ensp;|&ensp;"),
        roomname: roomname,
        event: "help",
    })
}

// Display the roomname the user is connected to.
roomMessage.innerHTML = `${roomname} Chat`;

// Emitting username and roomname of newly joined user to server.
socket.emit('joined-user', {
    username: username,
    roomname: roomname,
})

// Sending data when user clicks send.
send.addEventListener('click', () =>{
    var isPrompt = false;
    if (message.value[0] === "/"){
        const components = message.value.split(' ');
        if(components[0] in prompts){
            isPrompt = true;
            prompts[components[0]](components);
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

// Allow the enter key to send a message.
window.addEventListener('keypress', function(e){
    if(e.key === "Enter" && message.value !== ""){
        document.getElementById('send').click();
    }
})

// Sending username if the user is typing.
message.addEventListener('keypress', () => {
    socket.emit('typing', {
        username: username, 
        roomname: roomname
    })
})

// Displaying if new user has joined the room.
socket.on('joined-user', (data)=>{
    output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>has Joined the Room</em></p>';
    document.getElementById('chat-message').scrollTop = document.getElementById('chat-message').scrollHeight;
})

// Displaying if a user disconnects from the room.
socket.on('disconnected-user', (data)=>{
    output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>has Left the Room</em></p>';
    document.getElementById('chat-message').scrollTop = document.getElementById('chat-message').scrollHeight;
})

// Display button clicks, switched users, and messages.
socket.on('chat', (data) => {
    if (data.forUser && data.forUser !== username){
        feedback.innerHTML = '';
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
            break;
    }
    document.getElementById('chat-message').scrollTop = document.getElementById('chat-message').scrollHeight;
})

// Displaying if a user is typing.
socket.on('typing', (user) => {
    feedback.innerHTML = '<p><em>' + user + ' is typing...</em></p>';
})

// Displaying online users.
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
