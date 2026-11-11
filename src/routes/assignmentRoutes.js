// src/routes/assignmentRoutes.js
//
// До рефакторингу всі ці маршрути звертались напряму до MongoDB
// Node.js Driver, наприклад:
//   const db = client.db("studentDB");
//   const docs = await db.collection("assignments").find({ score: { $gt: 80 } }).toArray();
//
// Після рефакторингу вся взаємодія з базою проходить через модель
// Mongoose Assignment, яка сама відповідає за валідацію, типи
// даних та підключення.

const express = require("express");
const Assignment = require("../models/Assignment");

const router = express.Router();

// ---------------------------------------------------------------------
// GET /assignments  — HTML-сторінка зі списком студентів (відображення
// даних на сторінці сервера, як і в попередній версії проекту).
// Підтримує необов'язковий query-параметр ?minScore=80
// ---------------------------------------------------------------------
router.get("/assignments", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.minScore) {
      filter.score = { $gt: Number(req.query.minScore) };
    }

    const assignments = await Assignment.find(filter).sort({ score: -1 });

    res.render("assignments", {
      assignments,
      minScore: req.query.minScore || "",
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------
// GET /api/assignments — той самий список, але у форматі JSON
// (зручно для тестування Postman-ом / curl-ом).
// ---------------------------------------------------------------------
router.get("/api/assignments", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.minScore) filter.score = { $gt: Number(req.query.minScore) };

    const assignments = await Assignment.find(filter).sort({ score: -1 });
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------
// GET /api/assignments/stats — агрегація: середній бал за предметом,
// лише ті предмети, де середній бал > 75 (перенесено з
// 02_aggregation.js на Mongoose Aggregation Pipeline).
// ---------------------------------------------------------------------
router.get("/api/assignments/stats", async (req, res, next) => {
  try {
    const stats = await Assignment.aggregate([
      {
        $group: {
          _id: "$subject",
          avgScore: { $avg: "$score" },
          studentsCount: { $sum: 1 },
        },
      },
      { $match: { avgScore: { $gt: 75 } } },
      { $sort: { avgScore: -1 } },
    ]);

    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------
// POST /api/assignments — створення нового документа.
// Валідація (required/min/max/enum) виконується автоматично схемою.
// ---------------------------------------------------------------------
router.post("/api/assignments", async (req, res, next) => {
  try {
    const { name, subject, score } = req.body;
    const created = await Assignment.create({ name, subject, score });
    res.status(201).json(created);
  } catch (err) {
    // ValidationError та дублікат унікального індексу (E11000)
    // повертаємо як 400, а не як 500 "внутрішню помилку сервера".
    if (err.name === "ValidationError" || err.code === 11000) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ---------------------------------------------------------------------
// PATCH /api/assignments/:id — часткове оновлення (наприклад, score).
// runValidators: true - щоб валідація схеми діяла й при оновленні.
// ---------------------------------------------------------------------
router.patch("/api/assignments/:id", async (req, res, next) => {
  try {
    const updated = await Assignment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Студента не знайдено" });
    }

    res.json(updated);
  } catch (err) {
    if (err.name === "ValidationError" || err.code === 11000) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ---------------------------------------------------------------------
// DELETE /api/assignments/:id — видалення документа за id.
// ---------------------------------------------------------------------
router.delete("/api/assignments/:id", async (req, res, next) => {
  try {
    const deleted = await Assignment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Студента не знайдено" });
    }

    res.json({ message: "Видалено", deleted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
