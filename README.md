# AI-Powered Civic Welfare & Grievance Redressal System

A complete, production-grade full-stack platform integrating a **React.js Frontend**, **Node.js + Express.js API Server**, **MongoDB Database Models**, and a **Python FastAPI ML Microservice**.

---

## 🏛️ System Architecture Overview

```
                           USER / CITIZEN
                                 │
                     React.js Frontend (Vite + Tailwind CSS)
                                 │
                         JWT Authentication
                                 │
                     Express.js REST API Server
                                 │
       ┌─────────────────────────┼─────────────────────────┐
       │                         │                         │
  Auth Service            Welfare Service           Complaint Service
       │                         │                         │
       └───────────────┬─────────┴─────────┬───────────────┘
                       │                   │
                       ▼                   ▼
                 MongoDB Atlas      Cloudinary/Storage
                       │
                       ▼
            FastAPI Python ML Microservice
       ┌───────────────┼───────────────┬───────────────┐
       │               │               │               │
 Scheme Eligibility  Ranked Scheme    Complaint NLP    AI Chatbot
 Random Forest Model  Recommender    Priority Classifier Engine
       │               │               │               │
       └───────────────┴───────────────┴───────────────┘
                       │
                       ▼
             Results to Express API
                       │
                       ▼
            React Dashboard / Chatbot
```

---

## 🚀 Key Modules & Features

### 1. 🤖 Python ML Microservice (`ml_service/`)
- **Scheme Recommendation Engine**: Evaluates citizen demographics (Income, Age, Gender, Occupation, Category, Education, State) using Random Forest & Rule-based scoring to generate match percentages and eligibility reasons.
- **Complaint NLP & Priority Classifier**: Uses TF-IDF and Naive Bayes NLP modeling to categorize civic grievances (*Road, Water, Electricity, Crime, Women Safety, Corruption, Healthcare, Education*) and predict priority level (*High, Medium, Low*).
- **AI Scheme Assistant Chatbot**: Conversational Q&A engine for scheme information, document requirements, and filing complaints.

### 2. ⚡ Express Backend API (`server/`)
- **JWT & Role-Based Security**: Roles for `Citizen`, `Admin`, and `Officer`.
- **Database Models**: Mongoose schemas for `User`, `Scheme`, `Complaint`, and `StatusLog`.
- **Hybrid Data Seeder**: Pre-loaded catalog of Indian government schemes (*PM Awas Yojana, Ayushman Bharat, PM Kisan, Post-Matric Scholarship, Ladli Behna, PM Vishwakarma*) and sample complaints with map coordinates.

### 3. 🎨 Modern React Frontend (`client/`)
- **Vibrant Glassmorphism Design System**: Built with Tailwind CSS, Framer Motion, Lucide icons, and Leaflet Maps.
- **Pages**:
  - `Home`: Hero with live counter, scheme directory, and civic grievance heatmap.
  - `WelfareFinder`: AI Scheme Matcher form yielding ranked recommendations.
  - `ApplyScheme`: Multi-step application modal with document verification.
  - `Complaint`: Grievance submission with location pin picker and real-time AI priority classification.
  - `ComplaintStatus`: Real-time status tracking timeline with municipal officer action logs.
  - `AdminDashboard`: Command center for officers to triage grievances, assign field units, update statuses, and view analytics.
  - `Chatbot`: Floating interactive AI assistant widget.

---

## 💻 How to Run the Application

### 1. Start Python ML Microservice
```bash
cd ml_service
python train_models.py
python api.py
```
*(Runs on `http://127.0.0.1:8000`)*

### 2. Start Express Backend API
```bash
cd server
npm start
```
*(Runs on `http://127.0.0.1:5000`)*

### 3. Start React Frontend
```bash
cd client
npm run dev
```
*(Runs on `http://localhost:3000`)*

---

## 🔑 Demo Login Accounts

| Role | Email | Password |
|---|---|---|
| **Citizen Applicant** | `ananya@citizen.in` | `user123` |
| **Municipal Officer / Admin** | `admin@gov.in` | `admin123` |
