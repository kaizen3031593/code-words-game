const {MongoClient} = require('mongodb');
 
/**
 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
 * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
 */
const dbPassword = "bJr6m5UqPuYoZMaR";
const dbName = "Cluster0";
const uri = `mongodb+srv://dbUser:${dbPassword}@cluster0.z40bi.mongodb.net/${dbName}?retryWrites=true&w=majority`;

// Storage variables for client connection and database
var client;
var db;
var users;

// Called when app opens to populate `client` and `db`.
async function openMongoConnection(){
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        db = client.db('rooms');
        users = db.collection("users");
        // Remove all documents in collection at start of application.
        clearAll();
    } catch (e) {
        console.error(e);
    }

}

// Helper function in openMongoConnection. DO NOT CALL ANYWHERE ELSE!
async function clearAll(){
    const result = await users.deleteMany({});
    console.log(`Removed ${result.deletedCount} document(s).`)
}

// Called when app exits.
async function closeMongoConnection(){
    await client.close();
}

// Create room in users collection.
async function createRoom(room){
    const result = await users.insertOne(room);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}

// Delete room in users collection.
async function deleteRoom(room){
    const result = await users.deleteOne({ _id: room });
    console.log(`${result.deletedCount} document(s) were deleted.`);
}

// Add to a room that already exists.
async function addPlayer(room, player){
    const result = await users.updateOne(
        { _id: room },
        { $push: { "players": player}}
    );
    console.log(`${player.username} added to ${result.modifiedCount} room`);
}

// Find a room by roomname (_id).
async function roomExists(room) {
    const result = await users.countDocuments({_id: room}, { limit: 1 })
    console.log(result);
    if (result === 1) {
        return true;
    } else return false;
}

// Remove player from a room that already exists.
async function removePlayerBySocketId(room, socketId){
    const result = await users.updateOne(
        { _id: room },
        { $pull: { "players": { "socket": socketId} }}
    );
    console.log(`${result.modifiedCount} player removed from ${room}`);
}

// Helper function to get players from a room.
async function getPlayersInRoom(room){
    const document = await users.findOne({ _id: room});
    if(document){
        return document.players;
    }
    return null;
}

// Returns an array of all the usernames in a room.
async function getUsernamesInRoom(room){
    const result = await getPlayersInRoom(room);
    var players = []
    if (result){
        result.forEach((player) => {
            players.push(player.username);
        }); 
    }
    console.log("getusernames")
    console.log(players.length);
    console.log(players);
    return players;
}

// Returns a dictionary of username to roles in a room.
async function getRolesInRoom(room){
    const result = await getPlayersInRoom(room);
    var roles = {}
    if(result){
        result.forEach((player) => {
            roles[player.username] = player.show;
        })
    }
    console.log(roles);
    return roles;
}

// Helper method for all updates.
async function updateMongoDocument(query, update){
    const result = await users.updateOne(query, update); 
    console.log(`modified ${result.modifiedCount} document(s).`)
    return result;
}

// Reset all roles in a room to "field" for a new game.
async function resetRoles(room){
    const query = { _id: room };
    const updateDocument = { $set: { "players.$[].show": false }};
    return updateMongoDocument(query, updateDocument);
}

// Switch between roles.
async function switchRoles(username, room, bool){
    const query = { _id: room, "players.username": username};
    const updateDocument = { $set: { "players.$.show": bool}};
    return updateMongoDocument(query, updateDocument);

}

module.exports = {
    openMongoConnection, 
    closeMongoConnection,
    createRoom, 
    deleteRoom, 
    addPlayer,
    removePlayerBySocketId,
    roomExists,
    getUsernamesInRoom,
    getRolesInRoom,
    resetRoles,
    switchRoles
};
 