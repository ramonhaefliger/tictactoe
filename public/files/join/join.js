let socket = io();

function redirectToJoin() {
    let input = document.getElementById('join-gameid').value;
    window.location.replace('/play#' + input)
}

function getGames() {
    socket.emit('game-list', '...');
}
getGames();

socket.on('game-list', function(gameList) {
    writeGames(gameList);
});

function writeGames(gameList) {
    let list = document.getElementById('game-list');
    list.innerHTML =
        `<tr>
           <th>PIN</th>
           <th>Name</th>
           <th>Spieler</th>
        </tr>`;
    for (let i = 0; i < gameList.length; i++) {
        let plus = '';
        if (gameList[i].players.length >= 2) {
            plus = 'disabled';
        }
        list.insertAdjacentHTML('beforeend',
            `<tr>
                      <td>#${gameList[i].id}</td>
                      <td>${gameList[i].name}</td>
                      <td>${gameList[i].players.length}/2</td>
                      <td><button id="list-join-button" onclick="location.replace('/play/#${gameList[i].id}')" ${plus}>BEITRETEN</button></td>
                  </tr>`
        );
    }
}