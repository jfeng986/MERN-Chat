const express = require('express');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { default: mongoose } = require('mongoose');
const cors = require('cors');
const User = require('./schema/user');


dotenv.config();
mongoose.connect(process.env.MONGO_URL, (err) => {
    if (err) throw err;
});

const jwtSecret = process.env.JWT_SECRET_KEY;

const app = express();
app.use(express.json());
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
      const createdUser = await User.create({username, password});
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

app.listen(3000);

//NbxDAKlnprWgO8pp