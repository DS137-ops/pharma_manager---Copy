require("dotenv").config();
const express = require("express");
const app = express();
const PharmaticRouter = require("./router/auth.router");
const AnalystRouter = require("./router/analyst.router");
const adminRouter = require("./router/admin.router");
const RadiologyRouter = require("./router/radiology.router");
const DoctorRouter = require("./router/doctor.router");
const http = require("http");
app.use("/uploads", express.static("uploads"));
const mongoose = require("mongoose");
const PORT = process.env.PORT;
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


const server = http.createServer(app);
const localUri = "mongodb://localhost:27017/medicalapp",
  GlobalUri =
    "mongodb+srv://feadkaffoura:YcQJ6vJSgdBFwX9b@cluster0.v3b0sud.mongodb.net/medicalapp?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(localUri)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/Pharmatic", PharmaticRouter);
app.use("/api/Analyst", AnalystRouter);
app.use("/api/Radiology", RadiologyRouter);
app.use("/api/Doctor", DoctorRouter);
app.use("/admin", adminRouter);

server.listen(PORT, () => {
  console.log(`server is Running ${PORT}`);
});
