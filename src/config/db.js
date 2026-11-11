// src/config/db.js
// Налаштування з'єднання з MongoDB Atlas через Mongoose.
// Раніше з'єднання встановлювалось напряму через MongoClient
// (MongoDB Node.js Driver). Тепер цю роль виконує mongoose.connect().

const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI не визначено. Створіть файл .env на основі .env.example"
    );
  }

  // Увімкнення строгого режиму запитів: Mongoose кидатиме помилку,
  // якщо у фільтрі/оновленні використано поле, якого немає в схемі.
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    console.log(`[mongoose] З'єднано з базою: ${mongoose.connection.name}`);
  });

  mongoose.connection.on("error", (err) => {
    console.error("[mongoose] Помилка з'єднання:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[mongoose] З'єднання з базою розірвано");
  });

  await mongoose.connect(uri);

  return mongoose.connection;
}

module.exports = connectDB;
