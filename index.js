const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const userRoute = require('./routes/users');
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');
const conversationRoute = require('./routes/conversations');
const messageRoute = require('./routes/messages');

const multer = require('multer');
const path = require('path');


dotenv.config();
MONGO_URL = process.env.MONGO_URL

mongoose.connect(MONGO_URL, {useNewUrlParser: true}, () => {
  console.log('connected to MongoDB')
})

app.use('/images', express.static(path.join(__dirname, 'public/images')));

//middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

const storage = multer.diskStorage({
  destination:(req,file,cb) => {
    cb(null, 'public/images');
  },
  filename: (req,file,cb) => {
    cb(null, req.body.name);
  }
})

const upload = multer({storage})
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    return res.status(200).json('File uploaded successfully')
  } catch(err) {
    console.log(err)
  }
})

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);





app.listen(8800, ()=> {
  console.log('Backend server is running!')
})


//Socket 
const io = require("socket.io")(8900, {
  cors: {
    origin: "http://localhost:3000",
  },
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user)=>user.userId === userId) &&
    users.push({ userId, socketId});
}

const removeUser = (socketId) => {
  users = users.filter(user=>user.socketId !== socketId)
}

  
io.on("connection", (socket) => {
  //when connected
  console.log("a user connected.");

  // take userid and socket id from user
  socket.on("addUser", userId=>{
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  })
  
  //send and get message

  //when disconnected
  socket.on("disconnect", () => {
    console.log("A user disconnected");
    removeUser(socket.id);
    io.emit("getUsers", users);
  })
});