let socket;


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
        wsupgrade()
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
            updateUI();
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
        const postsSection = document.getElementById('postsSection');
        const postForm = document.getElementById('postForm');
        const loginPrompt = document.getElementById('loginPrompt');

        if (username) {
            loginSection.style.display = 'none'; 
            registerSection.style.display = 'none';
            userSection.style.display = 'block'; 
            userSection.innerHTML = `<p>Welcome, ${username}!</p><button onclick="handleLogout()">Log Out</button>`;
            loginPrompt.style.display = 'none';
            postsSection.style.display = 'block';
            postForm.style.display = 'block';
            wsupgrade();
        } else {
            loginSection.style.display = 'block'; 
            registerSection.style.display = 'block';
            userSection.style.display = 'none';
            userSection.innerHTML = '';
            loginPrompt.style.display = 'block';
            postsSection.style.display = 'none';
            postForm.style.display = 'none';
        }
    });
}


function handlepost(event) {
    event.preventDefault();
    const content = document.getElementById('postContent').value;
    const media = document.getElementById('postMedia').files[0]; 
    const bid = document.getElementById('startingBid').value;
    const duration = document.getElementById('auctionDuration').value;

    const formData = new FormData();

    formData.append('content', content);
    formData.append('startingBid', bid);
    formData.append('auctionDuration', duration);

    if (media) {
        formData.append('media', media);
    }

    fetch('/check-login', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        const username = data.loggedIn ? data.username : 'Guest';
        go_to_post(formData, username);
    })
    .catch(error => console.error('Error', error));
}

function go_to_post(formData, username) {
    formData.append('username', username);

    fetch('/posts', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('P success', data);
        fetchPosts(); 
        document.getElementById('postContent').value = ''; 
        document.getElementById('postMedia').value = '';
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
            const countdownTimer = calculateCountdown(post.endTime);

            if (typeof post.currentBid === 'string') {
                post.currentBid = parseFloat(post.currentBid);
            }

            postElement.innerHTML = `<p>${post.username}: ${post.content} (Time left: ${countdownTimer})</p>`;

            if (post.mediaPath) {
                if (post.mediaPath.includes('.mp4')) {
                    postElement.innerHTML += `<video src="${post.mediaPath}" controls class="uploaded-media"></video>`;
                } else if (post.mediaPath.includes('.mp3')) {
                    postElement.innerHTML += `<audio src="${post.mediaPath}" controls class="uploaded-media"></audio>`;
                } else {
                    postElement.innerHTML += `<img src="${post.mediaPath}" alt="Posted Media" class="uploaded-media">`;
                }
            }
            
            postElement.innerHTML += `
                <p>Current bid: $<span id="currentBid-${post._id}">${post.currentBid.toFixed(2)}</span></p>
                <p>By: <span id="currentBidUser-${post._id}">${post.currentBidUser || 'Starting bid'}</span></p>
                <button onclick="placeBid('${post._id}')">Bid ($<span id="bidIncrement-${post._id}">${minIncrease(post.currentBid, '1')}</span>)</button>
                <input type="number" id="customBid-${post._id}" placeholder="Enter custom bid" min="${minIncrease(post.currentBid, '2')}">
                <button onclick="placeCustomBid('${post._id}')">Custom Bid</button>
                <p>(Websocket feature)</p>`;
            postsSection.appendChild(postElement);
        });
    })
    .catch(error => {
        console.error('fp failed', error);
    });
}


// function handleLike(postId) {
//     checkLogin().then(username => {
//         if (!username) {
//             console.log('not login');
//             return;
//         }

//         fetch('/posts/like', {
//             method: 'POST',
//             headers: {'Content-Type': 'application/json'},
//             body: JSON.stringify({ postId, username })
//         })
//         .then(response => response.json())
//         .then(data => {
//             console.log(data.message);
//             fetchPosts(); 
//         })
//         .catch(error => console.error('Like failed', error));
//     });
// }

function initializePostHandlers() {
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', handlepost);
    }
}


function wsupgrade() {
    socket = new WebSocket('ws://localhost:8080/');
  
    socket.onopen = function(e) {
      console.log("Connection established");
    };
  
    socket.onmessage = function(event) {
      console.log(`Data received from server: ${event.data}`);
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'updateBid') {
          const currentBidElement = document.getElementById(`currentBid-${message.postId}`);
          const currentBidUserElement = document.getElementById(`currentBidUser-${message.postId}`);
          const bidIncrementElement = document.getElementById(`bidIncrement-${message.postId}`);
          const newBid = parseFloat(message.newBid);
          
          if (currentBidElement && currentBidUserElement && bidIncrementElement) {
            currentBidElement.textContent = `${newBid.toFixed(2)}`;
            currentBidUserElement.textContent = message.currentBidUser;
            bidIncrementElement.textContent = minIncrease(parseFloat(message.newBid), '3');
          }
          
          const customBidInput = document.getElementById(`customBid-${message.postId}`);
          if (customBidInput) {
            customBidInput.min = minIncrease(parseFloat(message.newBid), '4');
          }
        }
      } catch (error) {
        console.error('Error parsing message from server:', error);
      }

    };

    socket.onerror = function(event) {
        console.error('WebSocket error observed:', event);
    };
}

function calculateCountdown(endTime) {
    const now = new Date().getTime();
    const timeLeft = endTime - now;
    let hours = Math.floor(timeLeft / (1000 * 60 * 60));
    let minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
    return `${hours}h ${minutes}m`;
  }


function minIncrease(currentBid, checknum) {
    Bid = parseFloat(currentBid);
    if (isNaN(Bid)) {
        console.error('Invalid currentBid:', currentBid, checknum);
        return NaN;
      }
    return (Bid + Math.max(currentBid * 0.05, 1)).toFixed(2);
}

function placeBid(postId) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected.');
        return;
    }
    const currentBidElement = document.getElementById(`currentBid-${postId}`);
    const currentBid = parseFloat(currentBidElement.innerText);
    const bidIncrement = minIncrease(currentBid, '5');
    socket.send(JSON.stringify({
        action: "placeBid",
        postId: postId,
        newBid: bidIncrement,
        username: localStorage.getItem('username') 
    }));
}

function placeCustomBid(postId) {
    const customBidInput = document.getElementById(`customBid-${postId}`);
    const customBid = parseFloat(customBidInput.value);
    const minimumIncrement = minIncrease(parseFloat(document.getElementById(`currentBid-${postId}`).innerText), '6');

    if(customBid < minimumIncrement) {
        alert(`Your bid must be at least $${minimumIncrement}`);
        return;
    }
    socket.send(JSON.stringify({
        action: "placeCustomBid",
        postId: postId,
        newBid: customBid,
        username: localStorage.getItem('username')
    }));
}



document.addEventListener("DOMContentLoaded", updateUI);
document.addEventListener('DOMContentLoaded', () => {
    initializeFormHandlers();
    initializePostHandlers();
    fetchPosts(); 
});

