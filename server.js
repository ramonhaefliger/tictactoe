const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

class Game {
    id;
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
    admin;
    turn;
}

let games = [];

app.use(express.static('public/files'));

io.on('connection', (socket) => {

    let currentGame;

    socket.on('create', (req) => {
        let game = new Game();
        let player = new Player();
        let gameId = generateId();

        game.id = gameId;
        player.name = 'Unnamed player';
        player.value = 'x';
        player.admin = true;
        player.turn = true;
        game.players.push(player);

        addGame(game);
        socket.join(gameId);
        socket.to(gameId).emit('create', {
            status: 'SUCCESS',
            msg: 'Successfully created game',
            gameId: gameId
        });
        currentGame = gameId;
    });

    socket.on('join', (req) => {
        let playerName;
        let gameId;
        let game = getGame(gameId);

        if(game.players.length < 2) {
            let player = new Player();
            player.name = playerName;
            player.value = 'o';
            player.turn = false;
            player.admin = false;

            game.players.push(player);
            games[getGameIndex(gameId)] = game;

            socket.join(gameId);
            socket.to(socket.id).emit('join', {
                status: 'SUCCESS',
                msg: 'Successfully joined game',
                gameId: game.id
            });
            currentGame = game.id;
        } else {
            socket.to(socket.id).emit('join',{
                status: 'FAILED',
                msg: 'Game is full',
                gameId: game.id
            });
        }
    });

    socket.on('turn', (field) => {
        io.emit('turn', field);
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

function getGameIndex(id) {
    for (let i = 0; i < games.length; i++) {
        let game = games[i];
        if (game.id === id) {
            return i;
        }
    }
    return null;
}

function removeGame(id) {
    for (let i = 0; i < games.length; i++) {
        let game = games[i];
        if (game.id === id) {
            game.splice(i, 1)
        }
    }
}

function addGame(game) {
    games.push(game);
}

function generateId() {
    let id = '';
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 9; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});