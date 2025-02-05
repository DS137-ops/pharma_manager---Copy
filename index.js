require('dotenv').config();
const express = require("express");
const app = express();
const http = require('http');
const mongoose = require("mongoose")
const PORT = process.env.PORT
const path = require("path");
app.use(express.static(path.join(__dirname, "assests")));
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
app.use(express.urlencoded({ extended: true }));
const { default: helmet } = require("helmet");
app.use(express.json()); 
app.use(mongoSanitize());
app.use(xss());
app.use(helmet());
const { Server } = require('socket.io');
const server = http.createServer(app);
const localUri = process.env.LOCAL,
GlobalUri = "mongodb+srv://feadkaffoura:YcQJ6vJSgdBFwX9b@cluster0.v3b0sud.mongodb.net/medicalapp?retryWrites=true&w=majority&appName=Cluster0"
const io = new Server(server, {
  cors: { origin: '*' }
});
app.use((req, res, next) => {
  req.io = io;
  next();
});
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
  });
});
mongoose
    .connect(GlobalUri)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
const authRouter = require("./router/auth.router");
app.use("/api", authRouter);
server.listen(PORT, () => {
  console.log(`server is Running ${PORT}`);
});