const express = require('express');
const cors = require('cors');
const authRoutes = require('./API/routes/authRoutes');
const flowRoutes = require('./API/routes/AutomationRoutes');
const LeadRoutes = require('./API/routes/LeadRoutes');
const AiRoutes = require('./API/routes/aiRoutes');
const DataManager = require('./Infrastructure/database/postgres');
const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/automation', flowRoutes);
app.use('/leads', LeadRoutes);
app.use('/Ai', AiRoutes);
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  next();
});
(async () => {
  try {
    await DataManager.connectAndSync({ alter: true }); // gọi 1 lần là đủ
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to connect DB:', err);
    process.exit(1);
  }
})();
