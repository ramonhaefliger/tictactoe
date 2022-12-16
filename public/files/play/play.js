let socket = io();
let urlParams = new URLSearchParams(window.location.search);
let gameId = urlParams.get('game');
let type = urlParams.get('type');
let adminId;
let playerValue;
let playerName;
let content = document.getElementById('content-box');

if(type !== 'create') {
    checkGame();
} else if (type === 'create') {
    writeContent();
}

function writeContent() {
    if(type === 'create') {
        content.innerHTML =
           `<div id="button-aligner">
              <div id="buttons">
                <h3>Spiel erstellen</h3>
                <label for="game-name-input">Wähle einen Namen für deinen Raum</label>
                <input id="game-name-input" placeholder="Raumname eingeben">
                <button onclick="createGame()">ERSTELLEN</button>
              </div>
            </div>`;
    } else if (type !== 'create' && gameId) {
        content.innerHTML =
           `<div id="button-aligner">
              <div id="buttons">
              <h3>Spiel beitreten</h3>
                <label for="player-name-input">Gib einen Benutzernamen ein, mit dem du Spielen willst.</label>
                <input id="player-name-input" placeholder="Benutzernamen eingeben">
                <button onclick="joinGame()">BEITRETEN</button>
              </div>
            </div>`;
    } else {
        content.innerHTML = `<h3>Diese URL ist ungültig</h3>`;
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
    socket.emit('joinStatus', {
        gameId: gameId,
    })
}

socket.on('joinStatusRes', function(res) {
    alert(JSON.stringify(res));
    if (res.status === 'SUCCESS') {
        writeContent();
    } else {
        content.innerHTML = `<h3>${res.msg}</h3>`;
    }
});

socket.on('create', function(res) {
    if (res.status === 'SUCCESS') {
        window.location.replace('/play?game=' + res.gameId);
    } else {
        alert(res.msg);
    }
});

socket.on('join', function(res) {
    writeGame();
    writeToLogs(`Player ${res.playerName} joined the game!`);
});

function writeToLogs(text) {
    document.getElementById('logs').insertAdjacentHTML('beforeend', `<a>${text}</a>`);
}

function writeGame() {
    document.getElementById('content-box').innerHTML =
       `<h1>Tic-Tac-Toe Online</h1>
        <div id="game-content">
          <div class="side-container" id="info-container">
            <div id="info">
              <a>Spiele-PIN: XXXXXX</a>
            </div>
          </div>
          <div id="game">
            <div id="game-fields" class="game-item">
              <div class="field" id="1"></div>
              <div class="field" id="2"></div>
              <div class="field" id="3"></div>
              <div class="field" id="4"></div>
              <div class="field" id="5"></div>
              <div class="field" id="6"></div>
              <div class="field" id="7"></div>
              <div class="field" id="8"></div>
              <div class="field" id="9"></div>
            </div>
          </div>
          <div class="side-container">
            <div id="log"></div>
          </div>
        </div>
        <a id="status">Status</a>`;
}