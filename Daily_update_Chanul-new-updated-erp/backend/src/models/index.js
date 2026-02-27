// const fs = require("fs");
// const path = require("path");
// const { sequelize } = require("../config/db");

// const db = {};

// fs.readdirSync(__dirname)
//   .filter((file) => file !== "index.js" && file.endsWith(".js"))
//   .forEach((file) => {
//     const model = require(path.join(__dirname, file))(
//       sequelize
//     );
//     db[model.name] = model;
//   });

// // ✅ APPLY ASSOCIATIONS
// Object.keys(db).forEach((modelName) => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

// db.sequelize = sequelize;

// module.exports = db;

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/db');

const basename = path.basename(__filename);

const db = {};

// Load all model files automatically
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  });

modelFiles.forEach(file => {
  try {
    const model = require(path.join(__dirname, file))(sequelize);
    db[model.name] = model;
  } catch (error) {
    console.error(`Error loading model ${file}:`, error);
  }
});

// Important: Run associations AFTER all models are loaded
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
    } catch (error) {
      console.error(`Error setting up associations for ${modelName}:`, error);
    }
  }
});

// Export everything
db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;