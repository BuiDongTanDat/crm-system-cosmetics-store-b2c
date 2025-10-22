const express = require('express');
const cors = require('cors');
const authRoutes = require('./API/routes/authRoutes');
const flowRoutes = require('./API/routes/AutomationRoutes');
const LeadRoutes = require('./API/routes/LeadRoutes');
const AiRoutes = require('./API/routes/aiRoutes');
const userRoutes = require('./API/routes/userRoutes');
const roleRoutes = require('./API/routes/roleRoutes');
const categoryRoutes = require('./API/routes/categoryRoutes');
const productRoutes = require('./API/routes/productRoutes');
const DataManager = require('./Infrastructure/database/postgres');
const CampaignRoute = require('./API/routes/CampaignRoutes')
const OrderRoutes = require('./API/routes/OrderRoutes');
const OrderDetailRoutes = require('./API/routes/OrderDetailRoutes'); 
const CustomerRoutes = require('./API/routes/CustomerRoutes');

const app = express();

const { setupSwagger } = require('./swagger');

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', // domain FE
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/automation', flowRoutes);
app.use('/leads', LeadRoutes);
app.use('/campaign', CampaignRoute);
app.use('/Ai', AiRoutes);
app.use('/roles', roleRoutes);
app.use('/users', userRoutes);
app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);
app.use('/orders',OrderRoutes);
app.use('/order_details',OrderDetailRoutes);
app.use('/customers',CustomerRoutes);


app.use((err, req, res, next) => {
  console.error(err.stack);
  next();
});


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
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }
})();