const express = require('express');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');
const cors = require('cors');

const employeeRouter = require("./routes/api/employees.js");
const menuRouter = require("./routes/api/menus.js");

// Create express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Route handlers
app.use("/api/employees", employeeRouter);
app.use("/api/menus", menuRouter);

app.use(errorhandler());

// Invoke the app's `.listen()` method below:
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

module.exports = app;
