# AI-Powered Civic Welfare & Scheme Recommendation Platform (RAG System)

A full-stack AI platform integrating a **React.js Frontend**, **Node.js + Express.js API Server**, **MongoDB Models**, and a **Python FastAPI Microservice** powered by **ChromaDB Vector Database** and **Gemini 2.5 Flash AI RAG Pipeline** with an Authoritative Hard Eligibility Engine over **3,400 Government Schemes**.

---

## 🏛️ System Architecture Overview

```
                         USER / CITIZEN
                               │
                   React.js Frontend (Vite + Tailwind)
                               │
                       PROFILE INPUT FORM
                               │
                       NORMALIZE PROFILE
                               │
                   EXPRESS API SERVER (Port 5000)
                               │
                FASTAPI ML MICROSERVICE (Port 8000)
                               │
                   3,400 DATASET (updated_data.csv)
                               │
                    GOVERNMENT LEVEL FILTER
                  /                        \
             CENTRAL                       STATE
                │                            │
          Match All States              Match User State
                │                            │
                └─────────────┬──────────────┘
                              │
                    HARD ELIGIBILITY FILTERS
            ┌─────────────────┼─────────────────┐
          Gender             Age              Income
            │                 │                 │
            └─────────────────┼─────────────────┘
                          Occupation
                              │
                           Student
                              │
                           Category
                              │
                     REMOVE INELIGIBLE SCHEMES
                              │
                     ONLY ELIGIBLE SCHEMES
                              │
                     COMPUTE MATCH SCORE %
                              │
                     SORT ASCENDING BY MATCH %
                              │
                     RETURN TO FRONTEND
```

---

## 🚀 Key Features

### 1. 🎯 Hard Welfare Eligibility Engine (`ml_service/` & `backend/`)
- **Dataset**: Built upon **3,400 Welfare Schemes** across Central and State government departments in `updated_data.csv`.
- **Full-Dataset Evaluation**: Evaluates hard demographic rules across all 3,400 schemes before any score sorting or pagination.
- **Strict Hard Filters**:
  - **State Filter**: Central schemes (`All India`) match all users. State schemes match ONLY residents of that specific state.
  - **Gender Filter**: Mismatched explicit gender requirements are completely excluded.
  - **Age Window**: Out-of-bounds applicant ages are excluded.
  - **Income Ceiling**: Household incomes exceeding scheme maximums are excluded.
  - **Student & Occupation**: Student-only schemes require verified active student status.
  - **Category Quota**: Reserved category quotas (SC, ST, OBC) strictly filter out non-qualifying profiles.
- **Ascending Match Score Order**: Eligible schemes are sorted **ASCENDING** by match percentage (e.g. 25%, 35%, 48%, 62%, 79%).

### 2. 🤖 AI RAG Recommendation & Gemini Chatbot
- **ChromaDB Vector Store**: Indexes 3,426 scheme vector chunks (`text-embedding-004`).
- **Gemini 2.5 Flash Chatbot**: Conversational Q&A assistant retrieving real-time policy guidelines from the 3,400 schemes database.

### 3. ⚡ Express Backend API (`backend/`)
- **JWT & Role-Based Security**: Roles for `Citizen`, `Admin`, and `Officer`.
- **Database Models**: Mongoose schemas for `User`, `Scheme`, `Complaint`, and `StatusLog`.

### 4. 🎨 Modern React Frontend (`frontend/`)
- **Vibrant Glassmorphism Interface**: Built with Tailwind CSS, Lucide icons, and interactive demographic filters.

---

## 💻 Dataset Preprocessing & Ingestion Commands

### 1. Preprocess Raw Dataset (`updated_data.csv`)
```bash
cd ml_service
python scripts/preprocess_welfare_dataset.py
```
*(Extracts state, level, age, income, gender, student, occupation, and category rules into `ml_service/data/processed_welfare_schemes.json`)*

### 2. Seed 3,400 Schemes into MongoDB
```bash
cd backend
node scripts/importWelfareSchemes.js
```
*(Idempotently upserts all 3,400 schemes into MongoDB using `slug` as the unique key)*

### 3. Run Automated Eligibility Test Suite
```bash
cd ml_service
python test_eligibility_system.py
```
*(Executes 10 automated test scenarios verifying State isolation, Gender/Age/Income filters, Ascending score sorting, and Deterministic outputs)*

---

## 🚀 How to Run Platform

### 1. Start Python ML Microservice
```bash
cd ml_service
python api.py
```
*(Runs on `http://127.0.0.1:8000`)*

### 2. Start Express Backend API
```bash
cd backend
npm start
```
*(Runs on `http://127.0.0.1:5000`)*

### 3. Start React Frontend
```bash
cd frontend
npm run dev
```
*(Runs on `http://localhost:3000`)*

---

