let socket = io();
let urlParams = new URLSearchParams(window.location.search);
let gameId = window.location.hash.slice(1);
let gameName;
let type = urlParams.get('type');
let adminId;
let playerValue;
let playerName;
let playerCount = 0;
let content = document.getElementById('content-box');

function hashChange() {
    location.reload();
}

window.onhashchange = hashChange;

if (gameId === 'test') {
    writeGame();
} else if(type !== 'create') {
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
                <a id="create-error-msg" class="error-msg"></a>
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
                <a id="join-error-msg" class="error-msg"></a>
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

function leaveGame() {
    location.replace('/');
}

function checkGame() {
    socket.emit('joinStatus', {
        gameId: gameId,
    })
}

socket.on('joinStatus', function(res) {
    if (res.status === 'SUCCESS') {
        writeContent();
    } else {
        content.innerHTML =
            `<p id="error-icon">:(</p>
             <a>${res.msg}</a>`;
    }
});

socket.on('create', function(res) {
    if (res.status === 'SUCCESS') {
        window.location.replace('/play#' + res.gameId);
    } else {
        document.getElementById('create-error-msg').innerHTML = res.msg + '!';
    }
});

socket.on('join', function(res) {
    if (res.status === 'SUCCESS') {
        gameName = res.gameName;
        playerName = res.playerName;
        playerCount++;
        writeGame();
        writeToLogs(`Spieler ${res.players[0].name} ist dem Spiel beigetreten!`);
        document.getElementById('player-list').insertAdjacentHTML('beforeend', `<li name="${res.players[0].name}">${res.players[0].name} (${res.players[0].value})</li>`);
    } else {
        document.getElementById('join-error-msg').innerHTML = res.msg + '!';
    }
});

socket.on('joins', function(res) {
    if (document.getElementsByName(res.playerName).length < 1) {
        writeToLogs(`Spieler ${res.playerName} ist dem Spiel beigetreten!`);
        document.getElementById('player-list').insertAdjacentHTML('beforeend', `<li name="${res.playerName}">${res.playerName} (${res.playerValue})</li>`);
        playerCount++;
    }
    if (playerCount > 1) {
        document.getElementById('overlay-text').style.display = 'none';
    }
});

socket.on('leave', function(res) {
    writeToLogs(`Spieler ${res.playerName} hat das Spiel verlassen.`);
    document.getElementsByName(res.playerName)[0].remove();

});

function writeToLogs(text) {
    let logs = document.getElementById('logs');
    logs.insertAdjacentHTML('beforeend', `<a>${text}</a>`);
    logs.scrollTop = logs.scrollHeight;
}

function writeGame() {
    document.getElementById('content-box').innerHTML =
       `<h1>Tic-Tac-Toe Online</h1>
        <div>
        <a>Ping: </a><a id="ping"></a>
        </div>
        <h2 id="room-title"></h2>
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
          <a id="overlay-text">Warten auf Spieler...</a>
            <div id="game-fields" class="game-item">
              <div class="field" id="1" onclick="fillField(1)"></div>
              <div class="field" id="2" onclick="fillField(2)"></div>
              <div class="field" id="3" onclick="fillField(3)"></div>
              <div class="field" id="4" onclick="fillField(4)"></div>
              <div class="field" id="5" onclick="fillField(5)"></div>
              <div class="field" id="6" onclick="fillField(6)"></div>
              <div class="field" id="7" onclick="fillField(7)"></div>
              <div class="field" id="8" onclick="fillField(8)"></div>
              <div class="field" id="9" onclick="fillField(9)"></div>
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
        </div>
        <div id="leave-button-container">
            <button id="leave-button" onclick="leaveGame()">
                <a style="display: flex; align-items: center;">
                  <i class="material-icons" style="font-size:20px">arrow_back</i>
                  Spiel verlassen
                </a>
            </button>
        </div>`;
        document.getElementById('game-pin').innerHTML = gameId;
        document.getElementById('room-title').innerHTML = gameName + " - #" + gameId;
}

setInterval(() => {
    const start = Date.now();

    socket.emit("ping", () => {
        const duration = Date.now() - start;
        document.getElementById('ping').innerHTML = duration;
    });
}, 1000);


// GAME

function fillField(field) {
    if (document.getElementById(field).innerHTML !== '') {
        document.getElementById(field).style.background = '#f53a12';
        delay(300).then(() => document.getElementById(field).style.background = 'white');
    }
    socket.emit('fill', {
        gameId: gameId,
        field: field
    })
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}


socket.on('fill', function(res) {
    document.getElementById(res.field).innerHTML = res.value;
});