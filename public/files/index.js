function redirectToGame() {
    let input = document.getElementById('join-gameid').value;
    window.location.replace('/play?game=' + input)
}