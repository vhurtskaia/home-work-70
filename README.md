# studentDB — Express + Mongoose сервер

Рефакторинг попереднього проекту: сервер на Express, що зберігав дані
в MongoDB Atlas через **MongoDB Node.js Driver**, переведено на
**Mongoose** — зі схемами, валідацією та індексами на рівні моделі.

## Зміст

- [Що змінилось (до / після)](#що-змінилось-до--після)
- [Структура проекту](#структура-проекту)
- [Встановлення](#встановлення)
- [Налаштування з'єднання з MongoDB Atlas](#налаштування-зєднання-з-mongodb-atlas)
- [Запуск](#запуск)
- [Модель даних (Assignment)](#модель-даних-assignment)
- [Маршрути сервера](#маршрути-сервера)
- [Тестування](#тестування)

---

## Що змінилось (до / після)

| | До рефакторингу (MongoDB Driver) | Після рефакторингу (Mongoose) |
|---|---|---|
| Залежність | `mongodb` | `mongoose` |
| З'єднання | `MongoClient.connect(uri)` → `client.db("studentDB")` | `mongoose.connect(uri)` (`src/config/db.js`) |
| Доступ до колекції | `db.collection("assignments")` | Модель `Assignment` (`src/models/Assignment.js`) |
| Структура документа | не описана, перевіряється вручну | Схема Mongoose з типами полів |
| Валідація | відсутня / ручна в коді маршруту | Вбудована у схему (`required`, `min`, `max`, `enum`) |
| Унікальність імені | `db.createIndex({name:1},{unique:true})` окремою командою | `unique: true` прямо в схемі поля `name` |
| Помилка дубліката | потрібно ловити `E11000` вручну | та сама помилка, але перехоплюється в обробнику маршруту й повертається як `400` з читабельним текстом |
| Запити | `find()`, `insertOne()`, `updateOne()`, `deleteOne()` напряму на `db.collection` | `Assignment.find()`, `.create()`, `.findByIdAndUpdate()`, `.findByIdAndDelete()` |
| Агрегація | `db.collection("assignments").aggregate([...])` | `Assignment.aggregate([...])` — той самий пайплайн, винесений в окремий маршрут `/api/assignments/stats` |

Уся бізнес-логіка (фільтрація за балом, середній бал за предметом,
видалення/оновлення) залишилась тією самою — змінився лише шар
доступу до даних.

## Структура проекту

```
.
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── src/
    ├── server.js                  # точка входу Express
    ├── seed.js                    # наповнення колекції тестовими даними
    ├── config/
    │   └── db.js                  # підключення до MongoDB Atlas через Mongoose
    ├── models/
    │   └── Assignment.js          # схема й модель Mongoose
    ├── routes/
    │   └── assignmentRoutes.js    # усі маршрути (CRUD + статистика)
    ├── views/
    │   └── assignments.ejs        # HTML-сторінка зі списком студентів
    └── public/
        └── style.css
```

Усі файли коду розташовані в `src/`; у корені залишені лише
проектні файли (`package.json`, `.env.example`, `.gitignore`, `README.md`).

## Встановлення

```bash
cd studentdb-mongoose-server
npm install
```

## Налаштування з'єднання з MongoDB Atlas

1. У MongoDB Atlas відкрийте **Database → Connect → Drivers** і
   скопіюйте рядок підключення (`mongodb+srv://...`).
2. Вставте його у `.env` замінивши `<user>`, `<password>` і назву
   кластера на свої дані:
   ```
   MONGODB_URI=mongodb+srv://myUser:myPassword@cluster0.xxxxx.mongodb.net/studentDB
   PORT=3000
   ```
   > Базу `studentDB` і колекцію `assignments` Mongoose створить
   > автоматично при першому записі даних (так само, як це було з
   > `use("studentDB")` у mongosh).
3. У Atlas, у розділі **Network Access**, переконайтесь, що ваша
   IP-адреса додана до списку дозволених (або тимчасово відкрийте
   `0.0.0.0/0` для розробки).

## Запуск

Наповнити базу тестовими даними (аналог `01_crud.js` з попередньої
роботи, але через модель Mongoose):

```bash
npm run seed
```

Запустити сервер:

```bash
npm start        # звичайний запуск
# або
npm run dev       # з автоперезапуском через nodemon
```

Сервер підніметься на `http://localhost:3000` і одразу перенаправить
на `http://localhost:3000/assignments`.

## Модель даних (Assignment)

Файл: `src/models/Assignment.js`

| Поле      | Тип      | Правила валідації                                   | Індекс            |
|-----------|----------|------------------------------------------------------|--------------------|
| `name`    | `String` | обов'язкове, 2–100 символів, обрізання пробілів       | унікальний (`unique: true`) |
| `subject` | `String` | обов'язкове, має бути одним зі списку (`Math`, `Physics`, `Biology`, `Chemistry`, `History`, `Other`) | звичайний, для прискорення фільтрації/агрегації за предметом |
| `score`   | `Number` | обов'язкове, від 0 до 100                             | —                  |
| `createdAt` / `updatedAt` | `Date` | додаються автоматично (`timestamps: true`) | — |

Приклад помилки валідації при спробі зберегти некоректні дані:

```json
{ "error": "Assignment validation failed: score: Бал не може бути більше 100" }
```

Приклад помилки при дублюванні імені (той самий `E11000`, що й у
mongosh, але перехоплений і перетворений на зрозумілу відповідь):

```json
{ "error": "E11000 duplicate key error collection: studentDB.assignments index: name_1 dup key: { name: \"Andriy\" }" }
```

## Маршрути сервера

| Метод | Шлях | Опис |
|-------|------|------|
| `GET`  | `/assignments` | HTML-сторінка зі списком студентів (таблиця). Підтримує `?minScore=80` для фільтрації прямо з форми на сторінці. |
| `GET`  | `/api/assignments` | Той самий список у форматі JSON. Параметри `?subject=Math` та `?minScore=80`. |
| `GET`  | `/api/assignments/stats` | Агрегація: середній бал за предметом, лише предмети із середнім балом > 75. |
| `POST` | `/api/assignments` | Створення нового студента. Тіло запиту: `{ "name": "...", "subject": "...", "score": 0-100 }`. |
| `PATCH`| `/api/assignments/:id` | Часткове оновлення (наприклад, `{ "score": 90 }`). |
| `DELETE` | `/api/assignments/:id` | Видалення студента за `_id`. |

### Приклад: головна сторінка з даними

`GET /assignments` рендерить `src/views/assignments.ejs` — таблицю
`name / subject / score`, отриману через `Assignment.find(...)`,
плюс просту форму фільтра за мінімальним балом. Це і є новий
(рефакторений) маршрут відображення даних, згаданий у завданні.

## Тестування

Швидка перевірка вручну через `curl`:

```bash
# список
curl http://localhost:3000/api/assignments

# фільтр за балом
curl "http://localhost:3000/api/assignments?minScore=80"

# статистика
curl http://localhost:3000/api/assignments/stats

# створення (валідне)
curl -X POST http://localhost:3000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{"name":"Taras","subject":"Math","score":95}'

# створення (невалідне — має повернути 400)
curl -X POST http://localhost:3000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{"name":"X","subject":"Math","score":150}'

# оновлення
curl -X PATCH http://localhost:3000/api/assignments/<ID> \
  -H "Content-Type: application/json" \
  -d '{"score":99}'

# видалення
curl -X DELETE http://localhost:3000/api/assignments/<ID>
```

Контрольний список для перевірки, що функціональність не зламалась
після рефакторингу:

- [ ] Сервер стартує і виводить у консоль `З'єднано з базою: studentDB`
- [ ] `GET /assignments` показує таблицю студентів у браузері
- [ ] Фільтр `minScore` на сторінці працює
- [ ] `GET /api/assignments/stats` повертає предмети із середнім балом > 75
- [ ] Спроба створити студента з існуючим ім'ям повертає `400` з текстом про дублікат
- [ ] Спроба створити студента з балом поза межами 0–100 повертає `400`
- [ ] `PATCH` і `DELETE` коректно змінюють/видаляють документ у Atlas (видно в Atlas → Collections)