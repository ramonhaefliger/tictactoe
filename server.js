const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

class Game {
    id;
    name;
    players = [];
    state = {
        status: null,
        message: null,
        fields: [
            '', '', '',
            '', '', '',
            '', '', ''
        ]
    }
}

class Player {
    name;
    value;
    turn;
}

let games = [];
let chars = ['x', 'o'];

io.on('connection', (socket) => {

    socket.on('create', (req) => {
        let game = new Game();
        let gameId = generateId(6);
        let gameName = req.gameName;
        game.id = gameId;
        game.name = gameName;

        addGame(game);
        socket.join(gameId);

        socket.emit('create', {
            status: 'SUCCESS',
            msg: 'Raum erfolgreich erstellt',
            gameId: gameId,
        });

        console.log("Room " + gameName + " (" + gameId + ") added");
        console.log("Number of rooms: " + games.length);
    });

    socket.on('join', (req) => {
        let playerName = req.playerName;
        let gameId = req.gameId;
        let game = getGame(gameId);

        if (game.players.length < 2) {
            let player = new Player();
            player.name = playerName;
            player.value = 'o';
            game.players.push(player);
            games[getGameIndex(gameId)] = game;

            socket.join(gameId);
            socket.to(gameId).emit('join', {
                status: 'SUCCESS',
                playerName: playerName,
                gameId: game.id
            });
            console.log("Player " + playerName + " joined game " + gameId);
        } else {
            console.log("Player " + playerName + " failed to join game " + gameId);
        }
    });

    socket.on('join-status', (req) => {
        let status;
        let msg;
        let game = getGame(req.gameId);

        if (game !== null) {
            if (game.players.length < 2) {
                status = "SUCCESS";
            } else {
                status = "FAILED";
                msg = "Raum ist schon voll";
            }
        } else {
            status = "FAILED";
            msg = "Diesen Raum gibt es nicht. überprüfe nochmals den Link.";
        }

        socket.emit('join-status', {
            status: status,
            msg: msg,
            gameId: req.gameId
        });
    })

});

function getGame(id) {
    for (let i = 0; i < games.length; i++) {
        let game = games[i];
        if (game.id === id) {
            return game;
        }
    }
    return null;
}

function getGameIndex(id) {
    for (let i = 0; i < games.length; i++) {
        let game = games[i];
        if (game.id === id) {
            return game.id;
        }
    }
    return null;
}

function addGame(game) {
    games.push(game);
}

function generateId(length) {
    let id = '';
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}


app.use(express.static('public/files'));
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});