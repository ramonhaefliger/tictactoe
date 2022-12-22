let socket = io();
let urlParams = new URLSearchParams(window.location.search);
let gameId = urlParams.get('game');
let type = urlParams.get('type');
let adminId;
let playerValue;
let playerName;
let content = document.getElementById('content-box');

if (type !== "test") {
    if(type !== 'create') {
        checkGame();
    } else if (type === 'create') {
        writeContent();
    }
} else {
    writeGame();
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
        content.innerHTML = `<a>Diese URL ist ungültig</a>`;
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
    if (res.status === 'SUCCESS') {
        writeContent();
    } else {
        content.innerHTML =
            `<p style="font-size: xxx-large">:(</p>
            <a>${res.msg}</a>`;
    }
});

socket.on('create', function(res) {
    if (res.status === 'SUCCESS') {
        window.location.replace('/play?game=' + res.gameId);
    } else {
        alert(res.msg);
    }
});

socket.on('joinRes', function(res) {
    alert(JSON.stringify(res));
    writeGame();
    //writeToLogs(`Player ${res.playerName} joined the game!`);
});

socket.on('joins', function(res) {
    writeToLogs(`Spieler ${res.playerName} ist dem Spiel beigetreten!`);
    document.getElementById('player-list').insertAdjacentHTML('beforeend', `<li>${res.playerName}</li>`)
});

socket.on('leave', function(res) {
    writeToLogs(`Spieler ${res.playerName} hat das Spiel verlassen.`);
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
              <div>Spiele-PIN: <a id="game-pin"></a></div>
              <div>
                Spieler:
                <ul id="player-list"></ul> 
              </div>
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
          <div class="side-container" id="logs-container">
            <div id="logs"></div>
          </div>
        </div>
        <div id="game-stats-container">
            <div id="game-stats">
              <div>
                <a id="status">SPIELER 1 IST DRAN</a>
              </div>
                <div id="players">
                  <table id="player-1">
                    <tr>
                      <th>Spieler 1</th>
                    </tr>
                    <tr>
                      <td class="points">0</td>
                    </tr>
                  </table> 
                   <table id="player-2">
                    <tr>
                      <th>Spieler 2</th>
                    </tr>
                    <tr>
                      <td class="points">0</td>
                    </tr>
                  </table>
              </div>
            </div>
        </div>`;
        document.getElementById('game-pin').innerHTML = gameId;
}