const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const bodyParser = require("body-parser");
const cors = require("cors");
const adminRoute = require("./routes/adminRoute");
const employeeRoute = require("./routes/employeeRoute");
const contactRoute = require("./routes/contactRoute");
const attendanceRoute = require("./routes/attendanceRoute");
const leaveApplicationRoute = require("./routes/leaveApplicationRoute");
const errorHandler = require("./middleWare/errorMiddleware");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://human-resource-management.vercel.app",
    ],
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route Middleware
app.use("/api/admins", adminRoute);
app.use("/api/employees", employeeRoute);
app.use("/api/contactus", contactRoute);
app.use("/api/attendance", attendanceRoute);
app.use("/api/leaveApplications",leaveApplicationRoute);

app.get("/", (req, res) => {
  res.send("Home Page");
});

// Error Middleware
app.use(errorHandler);

//connect to DB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server Running on PORT: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
