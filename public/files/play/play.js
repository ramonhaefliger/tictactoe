let socket = io();
let urlParams = new URLSearchParams(window.location.search);
let gameId = window.location.hash.slice(1);
let gameName;
let type = urlParams.get('type');
let playerName;
let playerCount = 0;
let content = document.getElementById('content-box');
let overlay;
let overlayText;
let logs;
let gameLoaded = false;

function hashChange() {
    location.reload();
}
window.onhashchange = hashChange;

if (gameId === 'test') {
    writeGame();
} else if (type === 'create') {
    writeContent();
} else if(type !== 'create') {
    checkGame();
}
function writeContent() {
    if(type === 'create') {
        content.innerHTML =
            `<div id="button-aligner">
              <div id="buttons">
                <h3>Spiel erstellen</h3>
                <label for="game-name-input">Wähle einen Namen für deinen Raum</label>
                <input id="game-name-input" placeholder="Raumname eingeben" maxlength="20">
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
                <input id="player-name-input" placeholder="Benutzernamen eingeben" maxlength="20">
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
    socket.emit('join-status', {
        gameId: gameId,
    })
}

socket.on('join-status', function(res) {
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
        playerCount = res.players.length;
        let players = res.players;

        if (!gameLoaded) {
            initializeGame(res);
            gameLoaded = true;
        } else {
            writeToLogs(`Spieler ${players[playerCount - 1].name} ist dem Spiel beigetreten!`);
            showJoinMessage(players[playerCount - 1].name);
        }

        if (playerCount > 1) {
            overlay.style.display = 'none';
        }

        let playerList = document.getElementById('player-list');
        playerList.innerHTML = '';

        for (let i = 0; i < playerCount; i++) {
            let playerName = players[i].name;
            let playerValue = players[i].value;
            playerList.insertAdjacentHTML('beforeend', `
                <li name="${playerName}">${playerName} (${playerValue})</li>`
            );
            document.getElementById('player-' + (i + 1)).innerHTML = playerName;
        }

    } else {
        let errorMsg = document.getElementById('join-error-msg');
        errorMsg.innerHTML = res.msg + '!';
    }
});

function initializeGame(res) {
    gameName = res.gameName;
    playerName = res.playerName;
    writeGame();
    ping();
    logs.innerHTML = '';
    for (let i = 0; i < res.players.length; i++) {
        let player = res.players[i];
        writeToLogs(`Spieler ${player.name} ist dem Spiel beigetreten!`);
    }
}

socket.on('leave', function(res) {
    playerCount--;
    writeToLogs(`Spieler ${res.playerName} hat das Spiel verlassen.`);
    let playerInList = document.getElementsByName(res.playerName);
    playerInList[0].remove();
    overlay.style.display = 'flex';
    overlayText.innerHTML = 'Warten auf Spieler...';
    showLeaveMessage(res.playerName);
});

function writeToLogs(text) {
    logs.insertAdjacentHTML('beforeend', `<a>${text}</a>`);
    logs.scrollTop = logs.scrollHeight;
}

function writeGame() {
    document.getElementById('content-box').innerHTML =
        `<h1>Tic-Tac-Toe Online</h1>
        <h2 id="room-title"></h2>
        <div id="ping-container">
            <a>Ping: </a><a id="ping"></a>
        </div>
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
          <div id="overlay">
            <a id="overlay-text">Warten auf Spieler...</a>
            <button id="reset-button" onclick="reset()" style="display: none">
                <a style="display: flex; align-items: center;">
                  <i class="material-icons" style="font-size:20px">refresh</i>
                  &nbsp;Nochmal spielen
                </a>
            </button>
          </div>
            <div id="game-fields" class="game-item">
              <div class="field" id="0" onclick="fillField(0)"></div>
              <div class="field" id="1" onclick="fillField(1)"></div>
              <div class="field" id="2" onclick="fillField(2)"></div>
              <div class="field" id="3" onclick="fillField(3)"></div>
              <div class="field" id="4" onclick="fillField(4)"></div>
              <div class="field" id="5" onclick="fillField(5)"></div>
              <div class="field" id="6" onclick="fillField(6)"></div>
              <div class="field" id="7" onclick="fillField(7)"></div>
              <div class="field" id="8" onclick="fillField(8)"></div>
            </div>
          </div>
          <div class="side-container" id="logs-container">
            <div id="logs"></div>
          </div>
        </div>
        <div id="game-stats-container">
            <div id="game-stats">
              <div>
                <a id="status">AUF SPIELER WARTEN...</a>
              </div>
                <div id="players" style="display: none">
                  <table>
                    <tr>
                      <th id="player-1">warten...</th>
                    </tr>
                    <tr>
                      <td class="points">0</td>
                    </tr>
                  </table>
                   <table>
                    <tr>
                      <th id="player-2">warten...</th>
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
    overlay = document.getElementById('overlay');
    overlayText = document.getElementById('overlay-text');
    logs = document.getElementById('logs');
}


function ping() {
    setInterval(() => {
        let start = Date.now();
        let ping = document.getElementById('ping');

        socket.emit("ping", () => {
            let duration = Date.now() - start;
            ping.innerHTML = duration;
        });
    }, 1000);
}

function fillField(id) {
    let field = document.getElementById(id);
    if (field.innerHTML === '') {
        socket.emit('fill', {
            gameId: gameId,
            field: id
        })
    } else {
        field.style.background = '#f53a12';
        delay(300).then(() => field.style.background = 'white');
    }
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function showJoinMessage(name) {
    document.body.insertAdjacentHTML('beforeend',
        `<div id="joinMessage" class="message">Spieler ${name} ist dem Spiel beigetreten! :)</div>`
    );
    delay(4000).then(() => document.getElementById('joinMessage').remove());
}

function showLeaveMessage(name) {
    document.body.insertAdjacentHTML('beforeend',
        `<div id="leaveMessage" class="message">Spieler ${name} hat das Spiel verlassen! :(</div>`
    );
    delay(4000).then(() => document.getElementById('leaveMessage').remove());
}

socket.on('fill', function(res) {
    document.getElementById(res.field).innerHTML = res.value;
});

socket.on('status', function(res) {
    document.getElementById('status').innerHTML = res.status.toUpperCase();
    if (res.won) {
        let resetBtn = document.getElementById('restart-button');
        overlay.style.display = 'flex';
        resetBtn.style.display = 'block';
        overlayText.innerHTML = 'Spiel fertig';
    }
});

socket.on('reset', function(res) {
    for (let i = 0; i < 9; i++) {
        document.getElementById(i).innerHTML = '';
    }
});

function reset() {
    socket.emit('reset', {
        gameId: gameId
    })
    let resetBtn = document.getElementById('restart-button');
    overlay.style.display = 'none';
    resetBtn.style.display = 'block';
}