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

function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
            confirmPassword: confirmPassword
        }),
    })
    .then(response => {
        if (!response.ok) {
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerConfirmPassword').value = '';
            return response.text().then(text => { throw new Error(text) });
        } 
        return response.json();
    })
    .then(data => {
        console.log('R success', data);
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerConfirmPassword').value = '';
    })
    .catch(error => {
        console.error('R failed', error);
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerConfirmPassword').value = '';
    });
}

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('L faild');
        }
        return response.json(); 
    })
    .then(data => {
        console.log(data);
        localStorage.setItem('username', username);
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        checkLogin()
    })
    .catch(error => {
        console.error('L faild', error);
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
    });
}


function updateUI(username) {
    const loginSection = document.getElementById('loginForm'); 
    const registerSection = document.getElementById('registerForm');
    const userSection = document.getElementById('userSection'); 

    loginSection.style.display = 'none'; 
    registerSection.style.display = 'none';
    userSection.style.display = 'block'; 

    userSection.innerHTML = `
        <p>Welcome, ${username}!</p>
        <button onclick="handleLogout()">Log Out</button>
    `;
}

function handleLogout() {
    const username = localStorage.getItem('username');

    fetch('/logout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username }) 
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lo faild');
        } else {
            const loginSection = document.getElementById('loginForm');
            const registerSection = document.getElementById('registerForm');
            const userSection = document.getElementById('userSection');

            loginSection.style.display = 'block';
            registerSection.style.display = 'block';
            userSection.style.display = 'none';
            userSection.innerHTML = ''; 
        }
    })
    .catch(error => {
        console.error('Lo faild', error);
    });
}


function initializeFormHandlers() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}


function checkLogin() {
    fetch('/check-login', {
        credentials: 'include'  
    })
    .then(response => response.json())
    .then(data => {
        if (data.loggedIn) {
            console.log('Loggined', data.username);
            updateUI(data.username);
        } else {
            console.log('not Loggined', data.message);
        }
    })
    .catch(error => console.error('error2', error));
}


document.addEventListener('DOMContentLoaded', initializeFormHandlers);
document.addEventListener("DOMContentLoaded", checkLogin);

