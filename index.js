require('dotenv').config();
const express = require("express");
const app = express();
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
const localUri = process.env.LOCAL,
GlobalUri = process.env.GLOBAL
mongoose
    .connect(GlobalUri)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
const authRouter = require("./router/auth.router");
app.use("/api", authRouter);
app.listen(PORT, () => {
  console.log(`server is Running ${PORT}`);
});