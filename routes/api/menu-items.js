const express = require("express");
const menuItemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const query = 'SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId';
  const placeholder = {$menuItemId: menuItemId};
  db.get(query, placeholder, (error, menuItem) => {
    if (error) {
      next(error);
    } else if (menuItem) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//GET all menu items for a single menu
menuItemsRouter.get("/", (req, res, next) => {
  const query = "SELECT * FROM MenuItem WHERE menu_id = $menuId";
  const placeholder = {$menuId: req.params.menuId};
  db.all(query, placeholder, (error, menuItems) => {
    if(error) {
      next(error);
    } else if(menuItems) {
      res.status(200).json({menuItems:menuItems});
    } else {
      res.sendStatus(404);
    }
  });
});

//POSTs a new menu item
menuItemsRouter.post("/", (req, res, next) => {
  const menuId = req.params.menuId;
  const newMenuItem = req.body.menuItem;
  const query = "INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)";
  const placeholders = {
    $name: newMenuItem.name,
    $description: newMenuItem.description,
    $inventory: newMenuItem.inventory,
    $price: newMenuItem.price,
    $menuId: menuId
  };
  if(!newMenuItem.name || !newMenuItem.inventory || !newMenuItem.price) {
    return res.sendStatus(400);
  }
  db.get(`SELECT * FROM Menu WHERE Menu.id = ${menuId}`, (error, menu) => {
    if(error) {
      next(error);
    } else if(menu) {
      db.run(query, placeholders, function(error) {
        if(error) {
          next(error);
        } else {
          db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, (error, menuItem) => {
            res.status(201).json({menuItem:menuItem});
          });
        }
      });
    } else {
      res.sendStatus(404);
    }
  });

});

//UPDATE a single menu item
menuItemsRouter.put('/:menuItemId', (req, res, next) => {
  const menuId = req.params.menuId;
  const menuItemId = req.params.menuItemId;
  const menuItemData = req.body.menuItem;
  const query = "UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price WHERE MenuItem.id = $menuItemId";
  const placeholders = {
    $menuItemId: menuItemId,
    $name: menuItemData.name,
    $description: menuItemData.description,
    $inventory: menuItemData.inventory,
    $price: menuItemData.price
  };
  if(!menuItemData.name || !menuItemData.inventory || !menuItemData.price) {
    return res.sendStatus(400);
  }
  db.get(`SELECT * FROM Menu WHERE Menu.id = ${menuId}`, (error, menu) => {
    if(error) {
      next(error);
    } else if(menu) {
      db.run(query, placeholders, function(error) {
        if(error) {
          next(error);
        } else {
          db.get(`SELECT * FROM MenuItem WHERE id = ${menuItemId}`, (error, menuItem) => {
            if(error) {
              next(error);
            }
            res.status(200).json({menuItem:menuItem});
          });
        }
      });
    } else {
      res.sendStatus(404);
    }
  });
});

//DELETE a menu item
menuItemsRouter.delete("/:menuItemId", (req, res, next) => {
  const menuId = req.params.menuId;
  const menuItemId = req.params.menuItemId;
  const query = "DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId";
  const placeholder = {$menuItemId: menuItemId};
  db.get(`SELECT * FROM Menu WHERE Menu.id = ${menuId}`, (error, menu) => {
    if(error) {
      next(error);
    } else if(menu) {
      db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${menuItemId}`, (error, menuItem) => {
        if(error) {
          next(error);
        } else if(menuItem) {
          db.run(query, placeholder, function(error) {
            if(error) {
              next(error);
            } else {
              res.sendStatus(204);
            }
          });
        } else {
          res.sendStatus(404);
        }
      });
    } else {
      res.sendStatus(404);
    }
  });
});

//Export menuItemsRouter
module.exports = menuItemsRouter;
