const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const port = 8080;
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { getDB } = require('./db');
const { ObjectId } = require('mongodb');
const escape = require('escape-html');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/') 
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});


const upload = multer({ storage: storage });
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next(); 
});

const { connectDB } = require('./db');
connectDB().then(() => {
  server.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});



const WebSocket = require('ws');
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', function connection(ws) {
  ws.on('message', async function incoming(message) {
    const mes = JSON.parse(message);

    if (mes.action === "placeBid" || mes.action === "placeCustomBid") {
        const db = getDB();
        const post = await db.collection('posts').findOne({ _id: ObjectId.createFromHexString(mes.postId) });

        if (post && mes.newBid > post.currentBid) {
            await db.collection('posts').updateOne(
                { _id:  ObjectId.createFromHexString(mes.postId) },
                { $set: { currentBid: mes.newBid, currentBidUser: mes.username } }
            );

            broadcastNewBid({ postId: mes.postId, newBid: mes.newBid, currentBidUser: mes.username });
        }
    }
  });
}); //ws work

server.on('upgrade', function upgrade(request, socket, head) {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
}); //ws upgrade

app.post('/register', async (req, res) => {
    console.log(req.body);
    const db = getDB();
    const { username, password, confirmPassword } = req.body;
    
    if (!username || !password || !confirmPassword) {
        return res.status(400).send('error1');
    }

    if (password !== confirmPassword) {
        return res.status(400).send('Tow different passwords');
    }

    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return res.status(400).send('Username already exists');
    }
  
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
  
    await db.collection('users').insertOne({
      username,
      hashedPassword,
      salt
    });
  
    res.status(201).send('R success');
  });// register

app.post('/login', async (req, res) => {
    const db = getDB();
    const { username, password } = req.body;

    const user = await db.collection('users').findOne({ username });
    if (!user) {
        return res.status(401).send('Incorrect username or password');
    }

    const match = await bcryptjs.compare(password, user.hashedPassword);
    if (!match) {
        return res.status(401).send('Incorrect username or password');
    }

    const token = jwt.sign({ username }, 'sk', { expiresIn: '1h' });
    const hashToken = crypto.createHash('sha256').update(token).digest('hex');

    await db.collection('tokens').insertOne({
        username,
        hashToken
    });

    res.cookie('token', token, { httpOnly: true, maxAge: 3600000 });
    res.status(200).json({ message: 'L success', username: username });
});//login


app.post('/logout', async (req, res) => {

    const db = getDB();
    const { username } = req.body;


    await db.collection('tokens').deleteMany({ username });

    res.clearCookie('token');
    res.status(200).send('Lo success');
}); //logout  



app.get('/check-login', async (req, res) => {
    const db = getDB();
    const token = req.cookies.token;

    if (!token) {
        return res.json({ loggedIn: false, message: 'not token'});
    }


    try {
        const realToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await db.collection('tokens').findOne({ hashToken: realToken });

        if (user) {
            res.json({ loggedIn: true, username: user.username });
        } else {
            res.json({ loggedIn: false, message: 'not match' });
        }
    } catch (error) {
        console.error('error3', error);
        res.status(400).json({ loggedIn: false, message: 'C failed' });
    }
}); //check



app.post('/posts', upload.single('media'), async (req, res) => {
    const db = getDB();
    const { username, startingBid,} = req.body;
    let { content } = req.body; 
    content = escape(content);
    const file = req.file;

    const auctionDuration = parseInt(req.body.auctionDuration);
    const endTime = new Date().getTime() + auctionDuration * 60 * 60 * 1000;



    const newPost = {
        username,
        content,
        mediaPath: file ? file.path : null,
        endTime,
        startingBid: parseFloat(startingBid).toFixed(2),
        currentBid: parseFloat(startingBid).toFixed(2),
        currentBidUser: null,
    };

    await db.collection('posts').insertOne(newPost);
    res.status(201).json({ message: 'p success' });
}); //create a post

app.get('/posts', async (req, res) => {
    const db = getDB();
    const posts = await db.collection('posts').find({}).toArray();
    res.status(200).json(posts);
}); //push the posts

// app.post('/posts/like', async (req, res) => {
//     const db = getDB();
//     const { postId, username } = req.body;

//     if (!username) {
//         return res.status(400).json({ message: 'user not found' });
//     }

//     const updated = await db.collection('posts').updateOne(
//         { _id: ObjectId.createFromHexString(postId) },
//         { $addToSet: { 'likes': username } }
//     );

//     if (updated.matchedCount === 0) {
//         return res.status(400).json({ message: 'post not found' });
//     }

//     if (updated.modifiedCount === 0) {
//         return res.status(400).json({ message: 'You have already reacted to this post' });
//     }

//     res.status(200).json({ message: 'l success' });
// }); //like

function broadcastNewBid(message) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'updateBid',
          postId: message.postId,
          newBid: parseFloat(message.newBid).toFixed(2),
          currentBidUser: message.currentBidUser
        }));
      }
    });
  }