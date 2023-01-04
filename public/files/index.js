let socket = io();

function redirectToJoin() {
    let input = document.getElementById('join-gameid').value;
    window.location.replace('/play#' + input)
}

function redirectToCreate() {
    window.location.replace('/play?type=create');
}

socket.emit('info', '...');

socket.on('info', function(res) {
    document.getElementById('game-count').innerHTML = res.gameCount;
    document.getElementById('user-count').innerHTML = res.userCount;
});