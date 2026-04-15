# 🏫 Smart Campus Management System

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Tech Stack](https://img.shields.io/badge/Stack-React_%7C_Express_%7C_PostgreSQL-orange)

A modern, high-performance, and secure campus management ecosystem designed to streamline administrative workflows, academic tracking, and campus-wide communications. This platform transforms traditional campus operations into a premium digital experience.

---

## 🚀 Key Modules & Features

### 🛡️ Admin Power Center
- **Overview Dashboard**: Real-time analytics and operational stats at a glance.
- **Identity Registry**: Full CRUD operations for Students, Faculty, Security, and Workers with automated credential workflows.
- **Academic Portfolio**: Comprehensive course and subject management with credit tracking.
- **Dynamic Scheduling**: Centralized timetable management for batches and rooms.

### 📢 Campus Communication
- **Live Broadcasts**: Instant notice broadcasting system for campus-wide updates.
- **Resolution Hub**: Dedicated portal for reporting and tracking campus-wide issues and maintenance requests.

### 🗺️ Infrastructure & Security
- **Blueprint Hub**: Digital repository for campus architecture and facility maps.
- **Role-Based Auth**: Secure JWT-protected access with mandatory password rotation policies.

---

## 🛠️ Technology Stack

### **Frontend**
- **React (Vite)**: Lighting fast single-page application architecture.
- **React Router 6**: Seamless navigation without page refreshes.
- **Lucide React**: Premium iconography for a clean SaaS aesthetic.
- **Vanilla CSS**: Custom-crafted "Premium White" design system.

### **Backend**
- **Node.js & Express**: Scalable RESTful API architecture.
- **PostgreSQL**: Robust relational data management.
- **JWT & Bcrypt**: Enterprise-grade security and password hashing.
- **Nodemailer**: Automated notification and credential delivery.

---

## 📦 Project Structure

```text
├── controllers/       # Backend business logic
├── models/            # Database schemas (PostgreSQL)
├── routes/            # API endpoint definitions
├── src/               # React Frontend Code
│   ├── components/    # Reusable UI components
│   ├── context/       # State management (Toasts, Auth)
│   ├── pages/         # Functional dashboard pages
│   ├── styles/        # Global CSS design system
│   └── utils/         # Helper functions & API wrappers
├── public/            # Static legacy assets
├── index.js           # Server entry point
└── vite.config.js     # Build & Dev optimization
```

---

## ⚙️ Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/rohithnayak42/Smart-campuS.git
   cd Smart-campuS
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root:
   ```env
   PORT=3000
   DATABASE_URL=your_postgresql_url
   JWT_SECRET=your_super_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Build the Frontend**
   ```bash
   npm run build
   ```

5. **Start the Engine**
   ```bash
   npm start
   ```

---

## 🔓 License & Credits

Developed with ❤️ for the **Smart Campus Initiative**. All rights reserved.

---

*“Empowering Education through Digital Excellence.”*
