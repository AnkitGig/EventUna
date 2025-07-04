const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();

connectDB();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use("/api",express.static("public"))
app.use(express.static(path.join(__dirname, 'view')));


app.get('/', (req, res) => {
 console.log("login --------");
 
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
