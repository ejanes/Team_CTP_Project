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
        updateUI()
    })
    .catch(error => {
        console.error('L faild', error);
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
    });
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
            localStorage.removeItem('username');

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
    return fetch('/check-login', {
        credentials: 'include'  
    })
    .then(response => response.json())
    .then(data => {
        if (data.loggedIn) {
            console.log('Logged in', data.username);
            return data.username;  
        } else {
            console.log('Not logged in', data.message);
            return null;  
        }
    })
    .catch(error => {
        console.error('Error', error);
        return null;  
    });
}


function updateUI() {
    checkLogin().then(username => {
        const loginSection = document.getElementById('loginForm'); 
        const registerSection = document.getElementById('registerForm');
        const userSection = document.getElementById('userSection'); 

        if (username) {
            loginSection.style.display = 'none'; 
            registerSection.style.display = 'none';
            userSection.style.display = 'block'; 
            userSection.innerHTML = `<p>Welcome, ${username}!</p><button onclick="handleLogout()">Log Out</button>`;
        } else {
            loginSection.style.display = 'block'; 
            registerSection.style.display = 'block';
            userSection.style.display = 'none';
            userSection.innerHTML = '';
        }
    });
}


function handlepost(event) {
    event.preventDefault();
    const content = document.getElementById('postContent').value;

    fetch('/check-login', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        const username = data.loggedIn ? data.username : 'Guest';
        go_to_post(content, username);
    })
    .catch(error => console.error('Error', error));
}

function go_to_post(content, username) {
    fetch('/posts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, content})
    })
    .then(response => response.json())
    .then(data => {
        console.log('P success', data);
        fetchPosts(); 
        document.getElementById('postContent').value = ''; 
    })
    .catch(error => {
        console.error('P failed', error);
    });
}


function fetchPosts() {
    fetch('/posts')
    .then(response => response.json())
    .then(posts => {
        const postsSection = document.getElementById('postsSection');
        postsSection.innerHTML = ''; 
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.innerHTML = `
                <p>${post.username}: ${post.content} (Posted on: ${post.timestamp})</p>
                <button onclick="handleLike('${post._id}')">Like (${post.likes.length})</button>
            `;
            postsSection.appendChild(postElement);
        });
    })
    .catch(error => {
        console.error('fp failed', error);
    });
}


function handleLike(postId) {
    checkLogin().then(username => {
        if (!username) {
            console.log('not login');
            return;
        }

        fetch('/posts/like', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ postId, username })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            fetchPosts(); 
        })
        .catch(error => console.error('Like failed', error));
    });
}

function initializePostHandlers() {
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', handlepost);
    }
}




document.addEventListener("DOMContentLoaded", updateUI);
document.addEventListener('DOMContentLoaded', () => {
    initializeFormHandlers();
    initializePostHandlers();
    fetchPosts(); 
});
