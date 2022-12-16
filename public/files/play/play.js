let socket = io();

let value = 'x';

function fillField(id) {
    let field = document.getElementById(id);
    if (field.innerHTML === '') {
        socket.emit('turn', id);
    }
}

socket.on('turn', function(id) {
    let field = document.getElementById(id);
    field.innerHTML = value;
})