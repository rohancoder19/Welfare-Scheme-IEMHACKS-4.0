const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Connect to Database
connectDB();

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/schemes', require('./routes/schemeRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Civic Welfare & Grievance Express Backend API',
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[Express API] Civic Welfare & Grievance Server running on http://127.0.0.1:${PORT}`);
});

module.exports = app;
