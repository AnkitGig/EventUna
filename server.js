const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const connectDB = require('./config/db');
const indexRoutes = require('./routes/indexRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Connect to DB
connectDB();

// ✅ Middlewares
app.use(express.json());
app.use(morgan('dev'));

// ✅ Static Files
app.use("/api", express.static(path.join(__dirname, "public")));  
app.use(express.static(path.join(__dirname, 'view')));           

// ✅ Routes
app.use('/api', indexRoutes);


// ✅ Root Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
