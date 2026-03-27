# 💸 FairShare – Smart Expense Splitting App

🔗 **Live Demo:** [https://fairsharre.netlify.app/](https://fairsharre.netlify.app/)

💻 **Github:** [https://github.com/Ankush23056/FairShare-Shared-Expense](https://github.com/Ankush23056/FairShare-Shared-Expense)

FairShare is a full-stack web application designed to simplify the process of tracking and settling shared expenses among friends or roommates. This project focuses on managing complex data relationships and providing a seamless user experience for financial transparency.

This project was built to demonstrate proficiency in full-stack development, database management, and secure authentication for internship applications.

---

## ✨ Features

### ✅ Expense Management
* Add and categorize shared expenses with descriptions and amounts. 
* Split costs among specific group members. 
* Track who paid and who owes what in real-time. 

### 👥 Group Collaboration
* Create groups for different occasions (e.g., Roommates, Trips, Events). 
* Add members to groups to manage collective spending. 

### 🔐 Secure Authentication
* User registration and login functionality. 
* Secure password handling and data protection. 

### 📊 Settlement Logic
* Automatic calculation of net balances for each member. 
* Record settlements to clear debts and keep histories accurate. 

### 🎨 UI & Interactions
* Clean, intuitive dashboard for a bird's-eye view of finances.
* Responsive design built for both desktop and mobile use.
* Real-time UI updates after adding expenses or settlements.

---

## 🕹️ How It Works

1. **Join/Create a Group:** Users can create a dedicated space for a specific set of people. 
2. **Log Expenses:** One member pays for an item and logs the total amount and the participants. 
3. **Automatic Splitting:** The app calculates the individual share for every member involved. 
4. **Settle Up:** Users can see their total balance and record payments to "even out" with others. 

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Tailwind CSS, Vite
* **Backend:** Node.js, Express.js
* **Database:** MySQL (Hosted on Aiven)
* **ORM:** Prisma 7.6.0 
* **Deployment:** Netlify (Frontend) & Render (Backend)

---

## 🧠 Key Learnings

* **Database Modeling:** Designing complex relational schemas for users, groups, and many-to-many expense splits. 
* **Full-Stack Integration:** Connecting a React frontend with a Node.js API and a live MySQL cloud database.
* **Prisma Configuration:** Implementing the new Prisma configuration patterns using `prisma.config.ts`. 
* **State Management:** Handling shared data across multiple components to ensure financial figures remain consistent.
* **API Security:** Managing environment variables and secure database connections in a production environment.

---

## 👤 Author
**Ankush Kumar** | Full-Stack Developer Intern
