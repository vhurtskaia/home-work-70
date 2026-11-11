// src/seed.js
// Допоміжний скрипт для наповнення колекції тестовими даними через
// Mongoose (аналог insertMany з попередньої лабораторної роботи
// на mongosh, але тепер дані проходять валідацію схеми).
//
// Запуск:  npm run seed

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Assignment = require("./models/Assignment");

const sampleData = [
  { name: "Andriy", subject: "Math", score: 92 },
  { name: "Olena", subject: "Physics", score: 78 },
  { name: "Bohdan", subject: "Math", score: 65 },
  { name: "Anna", subject: "Biology", score: 88 },
  { name: "Serhiy", subject: "Physics", score: 81 },
];

async function seed() {
  await connectDB();

  await Assignment.deleteMany({});
  const created = await Assignment.insertMany(sampleData);

  console.log(`Додано ${created.length} документів у колекцію assignments`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Помилка під час seed:", err.message);
  process.exit(1);
});
