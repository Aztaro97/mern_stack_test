require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require("./models/User");
const bodyParser = require("body-parser");
const authRoutes = require('./routes/authRoutes');
const forgotPassRoutes = require("./routes/forgetPasswordRoute");
const taskRoutes = require('./routes/taskRoutes');
const userLogRoutes = require('./routes/userLogRoutes');

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api", forgotPassRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin/user-logs', userLogRoutes);
const PORT = process.env.PORT || 5050;

const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.error(" MONGO_URI is not defined. Check your .env file!");
    process.exit(1);
}
app.listen(PORT,()=>{
    console.log(`Server started on port ${PORT}`);
})
mongoose.connect(mongoURI)
    .then(() => console.log(" Connected to MongoDB!"))
    .catch(err => console.error(" Database connection failed:", err));

app.get("/",(req,res)=>{
    res.json({ message: "TaskFlow API Server is running!", endpoints: ["/api/auth", "/api/tasks"] });
})
const adminRoutes = require("./routes/admindash");
app.use("/admin", adminRoutes);

app.delete("/admin/users/:email", async (req, res) => {
    try {
      const { email } = req.params;
  
      const result = await User.deleteOne({ email });
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
    
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
  });
  app.put("/admin/users/:email", async (req, res) => {
    const { email } = req.params;
    const { fullName, role } = req.body;
    
    console.log("Received Update:", { fullName, role });
  
    const user = await User.findOneAndUpdate(
      { email },
      { fullName, role },
      { new: true } // Ensure it returns updated data
    );
  
    if (!user) return res.status(404).json({ message: "User not found" });
  
    res.json(user);
  });
  