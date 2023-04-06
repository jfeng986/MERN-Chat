const express = require("express");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { default: mongoose } = require("mongoose");
const cors = require("cors");
const User = require("./schema/user");
const Message = require("./schema/message");
const bcrybt = require("bcryptjs");
const ws = require("ws");
const fs = require("fs");
const path = require("path");

dotenv.config();

mongoose.connect(process.env.MONGO_URL, (err) => {
  if (err) throw err;
});

const jwtSecret = process.env.JWT_SECRET_KEY;
const bcrybtSalt = bcrybt.genSaltSync(10);
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
  })
);

async function getUserDataFromRequest(req, res) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, async (err, decoded) => {
        if (err) throw err;
        resolve(decoded);
      });
    } else {
      reject("no token");
    }
  });
}

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const createdUser = await User.create({
      username,
      password: bcrybt.hashSync(password, bcrybtSalt),
    });
    jwt.sign(
      { userId: createdUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res.cookie("token", token).status(201).json({
          id: createdUser._id,
        });
      }
    );
  } catch (err) {
    if (err) throw err;
    res.status(500).json("error");
  }
});

app.get("/profile", async (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, async (err, decoded) => {
      if (err) throw err;
      res.json(decoded);
    });
  } else {
    res.status(401).json("no token");
  }
});

app.get("/users", async (req, res) => {
  const users = await User.find({}, { _id: 1, username: 1 });
  res.json(users);
});

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromRequest(req);
  const myUserId = userData.userId;
  const messages = await Message.find({
    sender: { $in: [userId, myUserId] },
    recipient: { $in: [userId, myUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const isPasswordValid = bcrybt.compareSync(password, foundUser.password);
    if (isPasswordValid) {
      jwt.sign(
        { userId: foundUser._id, username },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).status(201).json({
            id: foundUser._id,
          });
        }
      );
    } else {
      res.status(401).json("wrong password");
    }
  }
});

app.post("/logout", async (req, res) => {
  res.clearCookie("token").json("ok");
});

const server = app.listen(3000);

const webSocketServer = new ws.WebSocketServer({ server });

webSocketServer.on("connection", (connection, req) => {
  function notifyAllOnlineClients() {
    [...webSocketServer.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...webSocketServer.clients].map((client) => ({
            userId: client.userId,
            username: client.username,
          })),
        })
      );
    });
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAllOnlineClients();
    }, 1000);
  }, 500);

  connection.on("pong", () => {
    clearTimeout(connection.deathTimer);
  });

  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenString = cookies
      .split(" ")
      .find((str) => str.startsWith("token="));
    if (tokenString) {
      const token = tokenString.split("=")[1];
      jwt.verify(token, jwtSecret, async (err, decoded) => {
        if (err) throw err;
        const { userId, username } = decoded;
        connection.userId = userId;
        connection.username = username;
      });
    }
  }

  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text, file } = messageData;
    let filename = null;
    if (file) {
      const parts = file.name.split(".");
      const ext = parts[parts.length - 1];
      filename = Date.now() + "." + ext;
      const path = __dirname + "/uploads/" + filename;
      const bufferData = new Buffer(file.data.split(",")[1], "base64");
      fs.writeFile(path, bufferData, () => {});
    }
    if (recipient && (text || file)) {
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
        file: file ? filename : null,
      });
      [...webSocketServer.clients]
        .filter((client) => client.userId === recipient)
        .forEach((client) => {
          client.send(
            JSON.stringify({
              text,
              sender: connection.userId,
              recipient,
              file: file ? filename : null,
              _id: messageDoc._id,
            })
          );
        });
    }
  });
  notifyAllOnlineClients();
});
