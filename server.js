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
    socketId;
    turn;
    points;
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
            gameId: gameId
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
            player.socketId = socket.id;
            player.value = 'o';
            player.points = 0;
            game.players.push(player);
            games[getGameIndex(gameId)] = game;

            socket.join(gameId);
            socket.emit('joinRes', {
                status: 'SUCCESS',
                playerName: playerName,
                gameId: game.id
            });
            io.to(gameId).emit('joins', {
                playerName: playerName
            });
            console.log("Player " + playerName + " joined game " + gameId);
        } else {
            console.log("Player " + playerName + " failed to join game " + gameId);
        }
    });

    socket.on('disconnect', (req) => {
        let game = getGameByPlayerSocket(socket.id);
        let player = getPlayerBySocket(socket.id);
        if (game) {
            if (game.players.length === 1) {
                removeGame(game.id);
                return;
            }
            game.players.splice(getPlayerIndex(player.name), 1);
            games[getGameIndex(game.id)] = game;
            io.to(game.id).emit('leave', {
                playerName: player.name
            });
        }
    });

    socket.on('joinStatus', (req) => {
        let status;
        let msg;
        let game = getGame(req.gameId);

        if (game !== null) {
            if (game.players.length < 2) {
                status = "SUCCESS";
            } else {
                status = "FAILED";
                msg = "Raum ist schon voll.";
            }
        } else {
            status = "FAILED";
            msg = "Diesen Raum gibt es nicht. Überprüfe ob der Link korrekt ist.";
        }

        socket.emit('joinStatusRes', {
            status: status,
            msg: msg,
            gameId: req.gameId
        });
    });

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

function getGameByPlayerSocket(socketId) {
    for (let i = 0; i < games.length; i++) {
        let game = games[i];
        if (game.players.length > 0) {
            for (let i = 0; i < game.players.length; i++) {
                let player = game.players[i];
                if (player) {
                    if (player.socketId === socketId) {
                        return game;
                    }
                }
            }
        }
    }
    return null;
}

function getPlayerBySocket(socketId) {
    for (let i = 0; i < games.length; i++) {
        let game = games[i];
        if (game.players.length > 0) {
            if (game.players[0] && game.players[0].socketId === socketId) {
                return game.players[0];
            } else if (game.players[1] && game.players[1].socketId === socketId) {
                return game.players[1];
            }
        }
    }
    return null;
}

function getPlayerIndex(playerName) {
    for (let i = 0; i < games.length; i++) {
        let game = games[i];
        if (game.players[0].name === playerName) {
            return 0;
        } else if (game.players[1].name === playerName) {
            return 1;
        }
    }
    return null;
}

function getGameIndex(id) {
    for (let i = 0; i < games.length; i++) {
        let game = games[i];
        if (game.id === id) {
            return i;
        }
    }
    return null;
}

function addGame(game) {
    games.push(game);
}

function removeGame(id) {
    games.splice(getGameIndex(id), 1);
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
    console.log(`TicTacToe-Server listening on port ${port}`);
});