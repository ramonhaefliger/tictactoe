let socket = io();
let urlParams = new URLSearchParams(window.location.search);
let gameId = urlParams.get('game');
let type = urlParams.get('type');
let adminId;
let playerValue;
let playerName;
let modal = document.getElementsByClassName('modal-content')[0];

if(type !== 'create') {
    checkGame();
} else if (type === 'create') {
    printModal();
}

function printModal() {
    if(type === 'create') {
        modal.insertAdjacentHTML('beforeend', `
        <div id="button-aligner">
          <div id="buttons">
            <h3>Spiel erstellen</h3>
            <label for="game-name-input">Wähle einen Namen für deinen Raum</label>
            <input id="game-name-input" placeholder="Raumname eingeben">
            <button onclick="createGame()">ERSTELLEN</button>
          </div>
        </div>`);
    } else if (type !== 'create' && gameId) {
        modal.insertAdjacentHTML('beforeend', `
        <div id="button-aligner">
          <div id="buttons">
          <h3>Spiel beitreten</h3>
          <label for="player-name-input"></label>
            <input id="player-name-input" placeholder="Namen eingeben">
            <button onclick="joinGame()">BEITRETEN</button>
          </div>
        </div>`);
    } else {
        modal.insertAdjacentHTML('beforeend', `<h3>Diese URL ist ungültig</h3>`);
    }
}

function createGame() {
    let gameName = document.getElementById('game-name-input').value;
    socket.emit('create', {
        gameName: gameName
    })
}

function joinGame() {
    let playerName = document.getElementById('player-name-input').value;
    socket.emit('join', {
        gameId: gameId,
        playerName: playerName
    })
}

function checkGame() {
    socket.emit('getJoinStatus', {
        gameId: gameId,
    })
}

socket.on('joinStatus', function(res) {
    if (res.status === 'SUCCESS') {
        printModal();
    } else {
        modal.insertAdjacentHTML('beforeend', `
       <h3>${res.msg}</h3>`);
    }
});

socket.on('create', function(res) {
    if (res.status === 'SUCCESS') {
        document.getElementById('myModal').style.display = 'none';
        window.location.replace('/play?game=' + res.gameId)
    } else {
        alert(res.msg);
    }
});

socket.on('join', function(res) {
    document.getElementById('myModal').style.display = 'none';
    writeToLogs(`Player ${res.playerName} joined the game!`);
});

function writeToLogs(text) {
    document.getElementById('logs').insertAdjacentHTML('beforeend', `<a>${text}</a>`);
}