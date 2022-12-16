let socket = io();
function redirectToJoin() {
    let input = document.getElementById('join-gameid').value;
    window.location.replace('/play?game=' + input)
}

function redirectToCreate() {
    window.location.replace('/play?type=create');
}

socket.on('turn', function(id) {
    let field = document.getElementById(id);
    field.innerHTML = 'x';
});