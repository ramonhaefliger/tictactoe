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
        message: null,
        finished: false,
        fields: [
            '', '', '',
            '', '', '',
            '', '', ''
        ]
    }

    join(player) {
        this.players.push(player);
        this.reset();
    }

    leave(playerIndex) {
        this.players.splice(playerIndex, 1);
        this.reset();
    }

    fill(value, field) {
        this.state.fields[field] = value;
    }

    isWinner(player) {
        let winner = false;
        let value = player.value;
        let fields = this.state.fields;

        if (fields[0] === value && fields[1] === value && fields[2] === value) {
            winner = true;
        } else if (fields[3] === value && fields[4] === value && fields[5] === value) {
            winner = true;
        } else if (fields[6] === value && fields[7] === value && fields[8] === value) {
            winner = true;
        } else if (fields[0] === value && fields[3] === value && fields[6] === value) {
            winner = true;
        } else if (fields[1] === value && fields[4] === value && fields[7] === value) {
            winner = true;
        } else if (fields[2] === value && fields[5] === value && fields[8] === value) {
            winner = true;
        } else if (fields[0] === value && fields[4] === value && fields[8] === value) {
            winner = true;
        } else if (fields[2] === value && fields[4] === value && fields[6] === value) {
            winner = true;
        }
        return winner;
    }

    isFull() {
        let isFull = true;
        for (let i = 0; i < this.state.fields.length; i++) {
            if (this.state.fields[i] === '') {
                isFull = false;
            }
        }
        return isFull;
    }

    reset() {
        this.state.fields = ['', '', '', '', '', '', '', '', ''];
    }

    getPlayerTurn() {
        if (this.players[0].turn) {
            return this.players[0];
        } else {
            return this.players[1];
        }
    }

    switchPlayerTurn() {
        let turn;
        if (this.players[0].turn) {
            this.players[0].turn = !this.players[0].turn;
            this.players[1].turn = !this.players[1].turn;
            turn = this.players[1];
        } else {
            this.players[1].turn = !this.players[1].turn;
            this.players[0].turn = !this.players[0].turn;
            turn = this.players[0];
        }
        this.setStatusMsg(turn.name + ' ist an der Reihe');
    }

    setStatusMsg(msg) {
        this.state.message = msg;
    }
}

class Player {
    id;
    name;
    turn;
    value;
    socketId;
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

    socket.on('info', () => {
        io.to(socket.id).emit('info', {
            gameCount: games.length,
            userCount: userCount
        });
    });

    socket.on('game-list', () => {
        io.to(socket.id).emit('game-list', games);
    })

    socket.on('reset', (req) => {
        let game = getGame(req.gameId);
        if (!game) {
            return;
        }
        game.reset();
        io.to(game.id).emit('reset');
        game.setStatusMsg(game.getPlayerTurn().name + ' ist an der Reihe');
        sendStatusMsg(game.id, {
            statusMsg: game.getPlayerTurn().name + ' ist an der Reihe',
            finished: true,
            won: false
        })
    });

    socket.on('fill', (req) => {
        let game = getGame(req.gameId);
        let player = getPlayerBySocket(socket.id);
        let location;
        let status;
        let finished;
        let won;
        let winner;
        let reset;
        if (!game || !player) {
            return;
        }
        let value = player.value;
        if (game.state.fields[req.field] === '' && player.turn) {
            status = 'SUCCESS';
            location = game.id;
            game.fill(value, req.field)
            if (game.isWinner(player)) {
                game.setStatusMsg(player.name + ' hat das Spiel gewonnen');
                finished = true;
                won = true
                winner = 'player-' + (getPlayerIndex(player.name, game.id) + 1);
            } else {
                if (game.isFull()) {
                    reset = true;
                }
                game.switchPlayerTurn();
            }
        } else {
            status = 'FAILED';
            location = socket.id;
        }
        io.to(location).emit('fill', {
            status: status,
            field: req.field,
            value: value
        });
        sendStatusMsg(game.id, {
            statusMsg: game.state.message,
            finished: finished,
            won: won,
            winner: winner
        })
        if (reset) {
            game.reset();
            io.to(game.id).emit('reset', {won: false});
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
        if (!game) {
            return;
        }
        let status;
        let statusMsg;
        let msg;
        let location = socket.id;

        if (game.players.length < 2 && playerName.length <= 20 && !includesForbiddenChars(playerName) && (!game.players[0] || playerName !== game.players[0].name)) {
            location = game.id;
            let player = new Player();
            player.name = playerName;
            player.id = generateId(12);
            player.socketId = socket.id;
            if (game.players.length === 0) {
                player.value = chars[0];
                player.turn = true;
            } else {
                if (game.players[0].value === chars[0]) {
                    player.value = chars[1];
                } else if (game.players[0].value === chars[1]) {
                    player.value = chars[0];
                }
                statusMsg = game.players[0].name + ' ist an der Reihe';
                game.setStatusMsg(statusMsg);
            }
            player.points = 0;
            game.join(player);
            socket.join(gameId);
            status = 'SUCCESS';
            msg = null;
        } else if (playerName.length > 20) {
            status = 'FAILED';
            msg = 'Der Spielername ist zu lang (max. 20 Zeichen)';
        } else if (includesForbiddenChars(playerName)) {
            status = 'FAILED';
            msg = 'Der Spielername enthält verbotene Zeichen';
        } else if (playerName === game.players[0].name) {
            status = 'FAILED';
            msg = 'Dein Gegner hat diesen Namen schon';
        }
        io.to(location).emit('join', {
            status: status,
            msg: msg,
            playerName: playerName,
            gameId: game.id,
            gameName: game.name,
            players: game.players
        });
        sendStatusMsg(game.id, {
            statusMsg: statusMsg,
            finished: false,
            won: false
        })
     });

    socket.on('disconnect', () => {
        userCount--;
        let game = getGameByPlayerSocket(socket.id);
        let player = getPlayerBySocket(socket.id);
        if (!game || !player) {
            return;
        }
        if (game.players.length === 1) {
            removeGame(game.id);
            return;
        }
        let index = getPlayerIndex(player.name, game.id);
        game.leave(index);
        game.players[0].turn = true;
        io.to(game.id).emit('leave', {
            playerName: player.name
        });
    });

    socket.on('join-status', (req) => {
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

        socket.emit('join-status', {
            status: status,
            msg: msg,
            gameId: req.gameId
        });
    });

});

function sendStatusMsg(socket, status) {
    io.to(socket).emit('status-msg', status);
}

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

function getPlayerIndex(playerName, gameId) {
    for (let i = 0; i < games.length; i++) {
        let game = games[i];
        if (game.id === gameId) {
            if (game.players[0] && game.players[0].name === playerName) {
                return 0;
            } else if (game.players[1] && game.players[1].name === playerName) {
                return 1;
            }
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
    let forbiddenChars = ['<', '>'];
    for (let i = 0; i < forbiddenChars.length; i++) {
        if (text.includes(forbiddenChars[i])) {
            return true;
        }
    }
    return false;
}

app.use(express.static('public/files'));

app.get('*', function(req, res) {
    res.redirect('/404');
});
server.listen(port, () => {
    console.log(`TicTacToe-Online listening on port ${port}`);
});