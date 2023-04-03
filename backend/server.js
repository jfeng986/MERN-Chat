const express = require('express');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { default: mongoose } = require('mongoose');
const cors = require('cors');
const User = require('./schema/user');
const bcrybt = require('bcryptjs');
const ws = require('ws');


dotenv.config();
mongoose.connect(process.env.MONGO_URL, (err) => {
    if (err) throw err;
});

const jwtSecret = process.env.JWT_SECRET_KEY;
const bcrybtSalt = bcrybt.genSaltSync(10);
const app = express();
app.use(express.json());
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
}));

app.get('/test', (req, res) => {
    res.json('Hello World!');
});

app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  try {
    const createdUser = await User.create({
      username, 
      password: bcrybt.hashSync(password, bcrybtSalt),
    });
    jwt.sign({userId:createdUser._id,username}, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token).status(201).json({
        id: createdUser._id,
      });
    });
  } catch(err) {
    if (err) throw err;
    res.status(500).json('error');
  }
});

app.get('/profile', async (req, res) => {
  const token = req.cookies?.token;
  if(token){
    jwt.verify(token, jwtSecret, async (err, decoded) => {
      if(err) throw err;
      res.json(decoded);
    });
  }
  else{
    res.status(401).json('no token');
  }
  
});

app.post('/login', async (req, res) => {
  const {username,password} = req.body;
  const foundUser = await User.findOne({username});
  if(foundUser){
    const isPasswordValid = bcrybt.compareSync(password, foundUser.password);
    if(isPasswordValid){
      jwt.sign({userId:foundUser._id,username}, jwtSecret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token).status(201).json({
          id: foundUser._id,
        });
      });
    }
    else{
      res.status(401).json('wrong password');
    }
  }
});

const server = app.listen(3000);


const webSocketServer = new ws.WebSocketServer({server});
webSocketServer.on('connection', (connection, req) => {
  const cookies = req.headers.cookie;
  if(cookies){
    const tokenString = cookies.split(' ').find(str => str.startsWith('token='));
    if(tokenString){
      const token = tokenString.split('=')[1];
      jwt.verify(token, jwtSecret, async (err, decoded) => {
        if(err) throw err;
        const{userId, username} = decoded;
        connection.userId = userId;
        connection.username = username;
      });
    }
  }

  connection.on('message', (message) => {
    //console.log(isBinary ? message.toString() : message);
    const messageData = JSON.parse(message.toString());
    const {recipient, text} = messageData;
    //console.log(recipient, text);
    if(recipient && text){
      [...webSocketServer.clients]
        .filter(client => client.userId === recipient)
        .forEach(client => {client.send(JSON.stringify({text}))});
    }
    
  });


 
  //notify all online clients about new user is joined
  [...webSocketServer.clients].forEach(client => {
      client.send(JSON.stringify({
        online: [...webSocketServer.clients].map(client => ({userId:client.userId, username:client.username}))

      }
    ));
  }
);
});

