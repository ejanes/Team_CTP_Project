function updateClock() {
    const now = new Date();
    const nowInEST = new Date(now.getTime() + (now.getTimezoneOffset() - 4 * 60) * 60000);
    let hrs = nowInEST.getHours().toString().padStart(2, '0');
    if (hrs > 12){
        hrs = hrs-12;
    }
    let mins = nowInEST.getMinutes().toString().padStart(2, '0');
    let secs = nowInEST.getSeconds().toString().padStart(2, '0');
    document.getElementById('clock').textContent = hrs + ':' + mins + ':' + secs;
}
setInterval(updateClock, 1000);