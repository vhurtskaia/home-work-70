// src/server.js
// Точка входу Express-застосунку.
// Головна зміна порівняно з попередньою версією: замість
// MongoClient.connect(...) з MongoDB Node.js Driver тепер
// використовується connectDB() на основі Mongoose, а маршрути
// працюють з моделлю Assignment замість db.collection(...).

require("dotenv").config();

const path = require("path");
const express = require("express");
const connectDB = require("./config/db");
const assignmentRoutes = require("./routes/assignmentRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Парсинг JSON та form-даних з тіла запиту
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статичні файли (CSS тощо)
app.use(express.static(path.join(__dirname, "public")));

// Налаштування view engine (EJS) для відображення даних на сторінці
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Головна сторінка — редірект на список студентів
app.get("/", (req, res) => res.redirect("/assignments"));

// Підключення маршрутів
app.use("/", assignmentRoutes);

// Обробка 404
app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не знайдено" });
});

// Централізований обробник помилок
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Внутрішня помилка сервера" });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Сервер запущено: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Не вдалося запустити сервер:", err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
