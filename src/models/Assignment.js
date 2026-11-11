// src/models/Assignment.js
// Модель Mongoose для колекції "assignments".
// Раніше документи вставлялись напряму через
// db.collection("assignments").insertOne/insertMany без жодної
// схеми чи валідації на рівні застосунку. Тепер структура, типи
// даних, обов'язковість полів, валідація значень та індекси
// описані декларативно в схемі.

const mongoose = require("mongoose");
const { Schema } = mongoose;

const assignmentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Поле 'name' є обов'язковим"],
      trim: true,
      minlength: [2, "Ім'я має містити щонайменше 2 символи"],
      maxlength: [100, "Ім'я занадто довге"],
      unique: true,
    },
    subject: {
      type: String,
      required: [true, "Поле 'subject' є обов'язковим"],
      trim: true,
      enum: {
        values: ["Math", "Physics", "Biology", "Chemistry", "History", "Other"],
        message: "Предмет '{VALUE}' не входить до списку дозволених",
      },
    },
    score: {
      type: Number,
      required: [true, "Поле 'score' є обов'язковим"],
      min: [0, "Бал не може бути менше 0"],
      max: [100, "Бал не може бути більше 100"],
    },
  },
  {
    timestamps: true,
  }
);

// Додатковий (не унікальний) індекс на subject - прискорює
// агрегацію/фільтрацію за предметом (використовується у
// GET /api/assignments?subject=Math та в $group по subject).
assignmentSchema.index({ subject: 1 });

// Зручний віртуальний геттер - короткий підпис для відображення у view.
assignmentSchema.virtual("label").get(function () {
  return `${this.name} (${this.subject}): ${this.score}`;
});

assignmentSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Assignment", assignmentSchema);
