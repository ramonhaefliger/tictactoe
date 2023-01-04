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
    id;
    name;
    value;
    socketId;
    turn;
    points;
}

let games = [];
let chars = ['x', 'o'];
let userCount = 0;

io.on('connection', (socket) => {
    userCount++;

    socket.on('ping', (callback) => {
        callback();
    });

    socket.on('info', (req) => {
        io.to(socket.id).emit('info', {
            gameCount: games.length,
            userCount: userCount
        });
    });

    socket.on('fill', (req) => {
        let game = getGame(req.gameId);
        let player = getPlayerBySocket(socket.id);
        let value = '?';
        if (player) {
            value = player.value;
        }
        if (game && game.state.fields[req.field - 1] === '') {
            game.state.fields[req.field - 1] = value;
            games[getGameIndex(game.id)] = game;
            io.to(game.id).emit('fill', {
                field: req.field,
                value: value
            });
        }
    });

    socket.on('create', (req) => {
        let status;
        let msg;
        let gameId;
        let gameName = req.gameName;

        if (gameName.length <= 20 && !includesForbiddenChars(gameName) && gameName && gameName.length > 0) {
            let game = new Game();
            gameId = generateId(6);
            game.id = gameId;
            game.name = gameName;
            addGame(game);
            socket.join(gameId);
            status = 'SUCCESS';
            msg = 'Raum erfolgreich erstellt'
            console.log("Room " + gameName + " (" + gameId + ") added");
        } else if (gameName.length > 20) {
            status = 'FAILED';
            msg = 'Der Raumname ist zu lang (max. 20 Zeichen)';
        } else if (includesForbiddenChars(gameName)) {
            status = 'FAILED';
            msg = 'Der Raumname enthält verbotene Zeichen';
        } else if (!gameName || gameName.length === 0) {
            status = 'FAILED';
            msg = 'Der Raumname kann nicht leer sein';
        }
        socket.emit('create', {
            status: status,
            msg: msg,
            gameId: gameId,
            gameName: gameName
        });
    });

    socket.on('join', (req) => {
        let playerName = req.playerName;
        let gameId = req.gameId;
        let game = getGame(gameId);
        let status;
        let msg;

        if (playerName.length <= 20 && !includesForbiddenChars(playerName)) {
            if (game.players.length < 2) {
                let player = new Player();
                player.name = playerName;
                player.id = generateId(12);
                player.socketId = socket.id;
                if (game.players.length === 0) {
                    player.value = chars[0];
                } else {
                    player.value = chars[1];
                }
                player.points = 0;
                game.players.push(player);
                games[getGameIndex(gameId)] = game;

                socket.join(gameId);
                status = 'SUCCESS';
                msg = null;
            }
        } else if (playerName.length > 20) {
            status = 'FAILED';
            msg = 'Der Spielername ist zu lang (max. 20 Zeichen)';

        } else if (includesForbiddenChars(playerName)) {
            status = 'FAILED';
            msg = 'Der Spielername enthält verbotene Zeichen';

        }
        io.to(gameId).emit('join', {
            status: status,
            msg: msg,
            playerName: playerName,
            gameId: game.id,
            gameName: game.name,
            players: game.players
        });
     });

    socket.on('disconnect', () => {
        userCount--;
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

        if (game) {
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

        socket.emit('joinStatus', {
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
}

function getPlayerIndex(playerName) {
    for (let i = 0; i < games.length; i++) {
        let game = games[i];
        if (game.players[0] && game.players[0].name === playerName) {
            return 0;
        } else if (game.players[1] && game.players[1].name === playerName) {
            return 1;
        }
    }
}

function getGameIndex(id) {
    for (let i = 0; i < games.length; i++) {
        let game = games[i];
        if (game.id === id) {
            return i;
        }
    }
}

function addGame(game) {
    games.push(game);
}

function removeGame(id) {
    games.splice(getGameIndex(id), 1);
}

function generateId(length) {
    let id = '';
    let chars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    for (let i = 0; i < length; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

function includesForbiddenChars(text) {
    let forbidden = ['<', '>'];
    for (let i = 0; i < forbidden.length; i++) {
        if (text.includes(forbidden[i])) {
            return true;
        }
    }
    return false;
}

app.use(express.static('public/files'));

server.listen(port, () => {
    console.log(`TicTacToe-Online listening on port ${port}`);
});