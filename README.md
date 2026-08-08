# AI-Powered Civic Welfare & Scheme Recommendation Platform (RAG System)

A full-stack AI platform integrating a **React.js Frontend**, **Node.js + Express.js API Server**, **MongoDB Models**, and a **Python FastAPI Microservice** powered by **ChromaDB Vector Database** and **Gemini 2.5 Flash AI RAG Pipeline**.

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
            FastAPI Python Microservice
       ┌───────────────┼───────────────┬───────────────┐
       │               │               │               │
 Scheme Ingestion    ChromaDB       AI Profile    Gemini 2.5 Flash
   PDF/JSON RAG     Vector Store    Evaluator     RAG Chatbot
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

## 🚀 Key Features

### 1. 🤖 AI RAG Recommendation Engine (`ml_service/`)
- **ChromaDB Vector Store**: Indexes PDF policy guidelines and scheme documents using vector embeddings (`text-embedding-004`).
- **Semantic Profile Matcher**: Evaluates citizen demographics (Income, Age, Gender, Occupation, Social Category, State) against retrieved scheme content to determine eligibility (`Eligible`, `Probably Eligible`, `Not Eligible`).
- **Gemini 2.5 Flash AI Chatbot**: Conversational RAG Q&A assistant retrieving real-time vector scheme knowledge.

### 2. ⚡ Express Backend API (`server/`)
- **JWT & Role-Based Security**: Roles for `Citizen`, `Admin`, and `Officer`.
- **Database Models**: Mongoose schemas for `User`, `Scheme`, `Complaint`, and `StatusLog`.

### 3. 🎨 Modern React Frontend (`client/`)
- **Vibrant Glassmorphism Interface**: Built with Tailwind CSS, Framer Motion, Lucide icons, and Leaflet Maps.

---

## 💻 How to Run

### 1. Start Python ML Microservice
```bash
cd ml_service
python ingestion/ingest.py
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

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Citizen Applicant** | `ananya@citizen.in` | `user123` |
| **Municipal Officer / Admin** | `admin@gov.in` | `admin123` |
