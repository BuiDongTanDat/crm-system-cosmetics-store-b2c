const express = require('express');
const cors = require('cors');
const authRoutes = require('./API/routes/authRoutes');
const UserRoutes = require('./API/routes/userRoutes');
const DataManager = require('./Infrastructure/database/postgres');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/user', UserRoutes);

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
