const express = require('express');
const cors = require('cors');
const authRoutes = require('./API/routes/authRoutes');
const userRoutes = require('./API/routes/userRoutes');
const categoryRoutes = require('./API/routes/categoryRoutes');
const productRoutes = require('./API/routes/productRoutes');
const DataManager = require('./Infrastructure/database/postgres');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/category', categoryRoutes);
app.use('/product', productRoutes);

// Simple health check route
app.get('/', (req, res) => {
  res.send('CRM API is running successfully!');
});

// Start server
(async () => {
  try {
    await DataManager.connectAndSync({ alter: true });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log('------------------------------------------');
      console.log(`Server is running on: http://localhost:${PORT}`);
      console.log('------------------------------------------');
    });
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }
})();
