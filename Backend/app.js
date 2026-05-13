const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./src/routes/auth");
const { complaintRouter, adminRouter } = require("./src/routes/complaints");

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/ai", complaintRouter); // /api/ai/question is in complaintRouter
app.use("/api/complaints", complaintRouter);
app.use("/api/admin", adminRouter);

app.get("/", (req, res) => {
  res.send("Backend API is running");
});

module.exports = app;
