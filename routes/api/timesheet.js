const express = require("express");
const timesheetRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Set up timesheet router to be exported
timesheetRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const query = 'SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const placeholder = {$timesheetId: timesheetId};
  db.get(query, placeholder, (error, timesheet) => {
    if (error) {
      next(error);
    } else if (timesheet) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

// GET an employee's timesheets
timesheetRouter.get("/", (req, res, next) => {
  const query = "SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId";
  const placeholder = {$employeeId: req.params.employeeId};
  db.all(query, placeholder, (error, timesheets) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({timesheets: timesheets});
    }
  });
});


// POST a new timesheet for an employee
timesheetRouter.post("/", (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  const employeeId = req.params.employeeId;
  db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId}`, (error, employee) => {
    if (error) {
      next(error);
    } else if(employee) {
      if (!newTimesheet.hours || !newTimesheet.rate || !newTimesheet.date) {
        return res.sendStatus(400);
      }
      const query = "INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)";
      const placeholders = {
        $hours: newTimesheet.hours,
        $rate: newTimesheet.rate,
        $date: newTimesheet.date,
        $employeeId: req.params.employeeId
      };
      db.run(query, placeholders, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (error, timesheet) => {
            res.status(201).json({timesheet: timesheet});
          });
        }
      });
    } else {
      res.sendStatus(404);
    }
  });
});

//UPDATE an employee's timesheet
timesheetRouter.put("/:timesheetId", (req, res, next) => {
  const timesheetData = req.body.timesheet;
  const employeeId = req.params.employeeId;
  db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId}`, (error, employee) => {
    if (error) {
      next(error);
    } else if(employee) {
      if (!timesheetData.hours || !timesheetData.rate || !timesheetData.date) {
        return res.sendStatus(400);
      }
      const query = "UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE Timesheet.id = $timesheetId";
      const placeholders = {
        $hours: timesheetData.hours,
        $rate: timesheetData.rate,
        $date: timesheetData.date,
        $timesheetId: req.params.timesheetId,
        $employeeId: req.params.employeeId
      };
      db.run(query, placeholders, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`, (error, timesheet) => {
            res.status(200).json({timesheet: timesheet});
          });
        }
      });
    } else {
      res.sendStatus(404);
    }
  });
});

//DELETE an employee's timesheet
timesheetRouter.delete("/:timesheetId", (req, res, next) => {
  const timesheetData = req.body.timesheet;
  const employeeId = req.params.employeeId;
  db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId}`, (error, employee) => {
    if (error) {
      next(error);
    } else if(employee) {
      const query = "DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId";
      const placeholder = {$timesheetId: req.params.timesheetId};
      db.run(query, placeholder, function(error) {
        if (error) {
          res.sendStatus(404);
          next(error);
        } else {
          res.sendStatus(204);
        }
      });
    } else {
      res.sendStatus(404);
    }
  });
});

//EXPORT timesheet router
module.exports = timesheetRouter;
