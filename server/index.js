const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const { sequelize } = require('./models');

// Load environment variables
dotenv.config();

const app = express();

// Configure CORS
app.use(cors());

// Configure body parser with increased limits
app.use(bodyParser.json({
  limit: '50mb'
}));
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}));

// Database connection and sync
const initializeDatabase = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Sync all models - this will create tables if they don't exist
    await sequelize.sync();
    console.log('Database tables synchronized successfully.');

    // Check if admin exists, if not create default admin
    const { User } = require('./models');
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        is_verified: true
      });
      console.log('Default admin user created.');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    console.log('Error details:', error.message);
  }
};

// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Available routes:');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/student/login');
  console.log('  POST /api/auth/admin/login');
}); 