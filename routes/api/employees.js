const express = require("express");
const employeeRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Import timesheet router
const timesheetRouter = require('./timesheet.js');

employeeRouter.param('employeeId', (req, res, next, employeeId) => {
  const query = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const placeholder = {$employeeId: employeeId};
  db.get(query, placeholder, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

employeeRouter.use('/:employeeId/timesheets', timesheetRouter);

//Get all employees
employeeRouter.get("/", (req, res, next) => {
  query = "SELECT * FROM Employee WHERE is_current_employee = 1";
  db.all(query, (error, employees) => {
    if(error) {
      next(error);
    } else {
      res.status(200).json({employees: employees});
    }
  });
});

//Creates a new employee record
employeeRouter.post("/", (req, res, next) => {
  const newEmployee = req.body.employee;
  const query = "INSERT INTO Employee (id, name, position, wage, is_current_employee) VALUES ($id, $name, $position, $wage, $isCurrentEmployee)";
  const placeholders = {
    $name: newEmployee.name,
    $position: newEmployee.position,
    $wage: newEmployee.wage,
    $isCurrentEmployee: newEmployee.is_current_employee === 0 ? 0 : 1  // sets the default value
  };
  if(newEmployee.name && newEmployee.position && newEmployee.wage) {
    db.run(query, placeholders, function(error) {
      if(error) {
        next(error);
      }
      db.get("SELECT * FROM Employee WHERE id = $id", {$id: this.lastID}, (error, employee) => {
        if(error) {
          next(error);
        }
        if(employee) {
          res.status(201).json({employee:employee});
        }
      });
    });
  } else {
    res.sendStatus(400);
  }
});

//Gets a single employee
employeeRouter.get("/:employeeId", (req, res, next) => {
  const employeeId = req.params.employeeId;
  db.get("SELECT * FROM Employee WHERE id = $id", {$id: employeeId}, (error, employee) => {
    if(error) {
      next(error)
    } else if(employee){
      res.status(200).json({employee:employee});
    } else {
      res.sendStatus(404);
    }
  });
});

//Updates an employee's info
employeeRouter.put("/:employeeId", (req, res, next) => {
  const employeeData = req.body.employee;
  const query = "UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE id = $employeeId";
  const placeholders = {
    $name: employeeData.name,
    $position: employeeData.position,
    $wage: employeeData.wage,
    $isCurrentEmployee: employeeData.is_current_employee === 0 ? 0 : 1,  // sets the default value
    $employeeId: req.params.employeeId
  };
  if(employeeData.name && employeeData.position && employeeData.wage) {
    db.run(query, placeholders, function(error) {
      if(error) {
        next(error);
      } else {
        db.get("SELECT * FROM Employee WHERE id = $id", {$id: req.params.employeeId}, (error, employee) => {
          if(error) {
            next(error);
          } else if(employee) {
            res.status(200).json({employee:employee});
          } else {
            res.sendStatus(404);
          }
        });
      }
    });
  } else {
    res.sendStatus(400);
  }
});

//Updates a employee to unemployed
employeeRouter.delete("/:employeeId", (req, res, next) => {
  const placeholder = {$employeeId: req.params.employeeId};
  db.run("UPDATE Employee SET is_current_employee = 0 WHERE id = $employeeId", placeholder, function (error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (error, employee) => {
        if(employee) {
          res.status(200).json({employee:employee});
        } else {
          res.sendStatus(404);
        }
      });
    }
  });

});

//export employee router
module.exports = employeeRouter;
