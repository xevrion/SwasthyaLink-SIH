const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const Patient = require('./models/Patient');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors
    });
  }
  
  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
  
  // MongoDB connection error
  if (err.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      error: 'Database connection error'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// JWT middleware for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// POST /login - Dummy authentication
app.post('/login', (req, res, next) => {
  try {
    console.log('Login attempt:', { username: req.body.username });
    
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    const HARDCODED_USERNAME = process.env.HARDCODED_USERNAME || 'asha_worker';
    const HARDCODED_PASSWORD = process.env.HARDCODED_PASSWORD || 'password123';
    
    console.log('Expected credentials:', { username: HARDCODED_USERNAME });

    if (username === HARDCODED_USERNAME && password === HARDCODED_PASSWORD) {
      const token = jwt.sign(
        { username: username, role: 'asha_worker' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );
      
      console.log('Login successful for:', username);

      res.json({
        success: true,
        token: token,
        user: { username: username, role: 'asha_worker' }
      });
    } else {
      console.log('Login failed - Invalid credentials for:', username);
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

// POST /patients - Add new patient (protected)
app.post('/patients', authenticateToken, async (req, res, next) => {
  try {
    console.log('Adding patient:', req.body);
    const { name, age, gender, village, healthIssue } = req.body;

    // Enhanced validation
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Patient name is required'
      });
    }
    
    if (!age || isNaN(parseInt(age)) || parseInt(age) <= 0 || parseInt(age) > 150) {
      return res.status(400).json({
        success: false,
        error: 'Valid age is required (1-150)'
      });
    }
    
    if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        error: 'Valid gender is required (Male, Female, Other)'
      });
    }
    
    if (!village?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Village name is required'
      });
    }
    
    if (!healthIssue?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Health issue description is required'
      });
    }

    const patient = new Patient({
      name: name.trim(),
      age: parseInt(age),
      gender,
      village: village.trim(),
      healthIssue: healthIssue.trim()
    });

    const savedPatient = await patient.save();
    console.log('Patient saved successfully:', savedPatient._id);
    
    res.status(201).json({
      success: true,
      patient: savedPatient,
      message: 'Patient added successfully'
    });
  } catch (error) {
    console.error('Error saving patient:', error);
    next(error);
  }
});

// GET /patients - Get all patients (protected)
app.get('/patients', authenticateToken, async (req, res, next) => {
  try {
    console.log('Fetching patients for user:', req.user.username);
    const patients = await Patient.find().sort({ createdAt: -1 });
    
    console.log(`Found ${patients.length} patients`);
    
    res.json({
      success: true,
      patients: patients,
      count: patients.length
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    next(error);
  }
});

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'Connected' : 
                    dbState === 2 ? 'Connecting' : 
                    dbState === 3 ? 'Disconnecting' : 'Disconnected';
    
    res.json({ 
      status: 'OK', 
      message: 'Patient Management API is running',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      message: 'Health check failed',
      error: error.message 
    });
  }
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Apply error handler middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Demo credentials: asha_worker / password123`);
  console.log(`\n📊 Available endpoints:`);
  console.log(`   POST /login - Authenticate user`);
  console.log(`   POST /patients - Add patient (auth required)`);
  console.log(`   GET /patients - List patients (auth required)`);
  console.log(`   GET /health - Health check`);
});
