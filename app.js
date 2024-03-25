const express = require('express');
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


app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next(); 
});

const { connectDB } = require('./db');
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});


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


app.post('/posts', async (req, res) => {
    const db = getDB();
    const { username } = req.body;
    let { content } = req.body; 
    content = escape(content);

    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');


    const newPost = {
        username,
        content,
        timestamp,
        likes: [],
    };

    await db.collection('posts').insertOne(newPost);
    res.status(201).json({ message: 'p success' });
}); //create a post

app.get('/posts', async (req, res) => {
    const db = getDB();
    const posts = await db.collection('posts').find({}).toArray();
    res.status(200).json(posts);
}); //push the posts

app.post('/posts/like', async (req, res) => {
    const db = getDB();
    const { postId, username } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'user not found' });
    }

    const updated = await db.collection('posts').updateOne(
        { _id: ObjectId.createFromHexString(postId) },
        { $addToSet: { 'likes': username } }
    );

    if (updated.matchedCount === 0) {
        return res.status(400).json({ message: 'post not found' });
    }

    if (updated.modifiedCount === 0) {
        return res.status(400).json({ message: 'You have already reacted to this post' });
    }

    res.status(200).json({ message: 'l success' });
}); //like

