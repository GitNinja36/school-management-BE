# 🏫 School Management Backend

This is the **backend** of the School Management System built using **Node.js**, **Express**, **Prisma ORM**, and **PostgreSQL**. It is designed to provide robust API services for managing users (students, teachers, principals), attendance, performance, classes, finance, messaging, and more in a school ecosystem.

---

## 🚀 Features

- ✅ **User Authentication & Authorization** (In progress)
- 📚 **Students & Teachers CRUD**
- 🎓 Class Representatives & Class Teachers management
- 📅 **Class Routines**, Events, Notices
- 🧮 **Attendance**, Exams, and Performance Tracking
- 💰 **Finance Checkbook**, Notes Management
- 📥 **Messaging system** for internal communication
- 🗃️ Built with **Prisma ORM** and PostgreSQL

---

## 🛠️ Tech Stack

| Tool | Description |
|------|-------------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Fast and minimalist web framework |
| **Prisma** | Next-generation ORM for PostgreSQL |
| **PostgreSQL** | Relational database |
| **JWT** (Coming soon) | For authentication |
| **Nodemon** | Auto-restart on file changes |

---

## 📁 Project Structure
<pre>

school-management-BE/
├── prisma/                  # Prisma schema and migration history
│   └── schema.prisma
├── controllers/             # All route controllers
├── routes/                  # Express route definitions
├── middlewares/             # Middlewares (e.g., auth)
├── utils/                   # Utility/helper functions
├── .env                     # Environment variables
├── server.js                # Entry point
└── README.md

</pre>
---

## ⚙️ Getting Started

1. Clone the repository

```bash
git clone https://github.com/GitNinja36/school-management-BE.git
cd school-management-BE


2. Install dependencies

npm install

### 3. Set up environment variables

Create a .env file 

### 4. Set up the database

npx prisma generate
npx prisma migrate dev --name init

### 5. Run the development server

npm run dev

---

