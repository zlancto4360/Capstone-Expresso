const express = require("express");
const menuRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Import menu-item router
const menuItemsRouter = require('./menu-items.js');

menuRouter.param('menuId', (req, res, next, menuId) => {
  const query = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const placeholder = {$menuId: menuId};
  db.get(query, placeholder, (error, menu) => {
    if (error) {
      next(error);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//Show where menu-item exists
menuRouter.use('/:menuId/menu-items', menuItemsRouter);

//GET all menus
menuRouter.get("/", (req, res, next) => {
  const message = {};
  const query = "SELECT * FROM Menu";
  db.all(query, (error, menus) => {
    if(error) {
      next(error);
    } else if(menus) {
      res.status(200).json({menus:menus});
    } else {
      res.status(404).json({message: "No menus were found."});
    }
  });
});

//POST a new menu
menuRouter.post("/", (req, res, next) => {
  const newMenu = req.body.menu;
  const query = "INSERT INTO Menu (title) VALUES ($title)";
  const placeholder = {$title: req.body.menu.title};
  if(!newMenu || !newMenu.title) {
    return res.sendStatus(400);
  }
  db.run(query, placeholder, function (error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id=${this.lastID}`, (error, menu) => {
        if(error) {
          next(error);
        } else {
          res.status(201).json({menu:menu});
        }
      });
    }
  });
});

//GET a single menu
menuRouter.get("/:menuId", (req, res, next) => {
  const query = "SELECT * FROM Menu WHERE Menu.id = $menuId";
  const placeholder = {$menuId: req.params.menuId};
  db.get(query, placeholder, (error, menu) => {
    if(error) {
      next(error);
    } else if(menu) {
      res.status(200).json({menu:menu});
    } else {
      res.sendStatus(404);
    }
  });
});

//UPDATE a single menu
menuRouter.put("/:menuId", (req, res, next) => {
  const query = "UPDATE Menu SET title = $title WHERE Menu.id = $menuId";
  const placeholders = {
    $title: req.body.menu.title,
    $menuId: req.params.menuId
  };
  if(!req.body.menu.title) {
    return res.sendStatus(400);
  }
  db.run(query, placeholders, function (error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`, (error, menu) => {
        if(error) {
          next(error);
        } else if(menu) {
          res.status(200).json({menu:menu});
        } else {
          res.sendStatus(404);
        }
      });
    }
  });
});

//DELETE a menu if the menu contains no related menu items
menuRouter.delete("/:menuId", (req, res, next) => {
  const menuId = req.params.menuId;
  const query = "DELETE FROM Menu WHERE Menu.id = $menuId";
  const placeholder = {$menuId: req.params.menuId};
  db.get(`SELECT * FROM Menu WHERE Menu.id = ${menuId}`, (error, menu) => {
    if(error) {
      next(error);
    } else if(menu) {
      db.get(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${menuId}`, (error, menuItems) => {
        if(error) {
          next(error);
        } else if(menuItems) {
          res.sendStatus(400);
        } else {
          db.run(query, placeholder, (error) => {
            if(error) {
              next(error);
            } else {
              res.sendStatus(204);
            }
          });
        }
      });
    } else {
      res.sendStatus(404);
    }
  });
});

//Export menu router
module.exports = menuRouter;
