require('dotenv').config(); 
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');


mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1); // exit app if Mongo fails
});
const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// Temporary OTP store
const otpStore = new Map();

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const bookingRoutes = require('./routes/bookings');
const staticRoutes = require('./routes/static');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  const submittedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });

  let transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.EMAIL_USER,
    subject: `New Contact Form Message from ${name}`,
    text: `You received a new message:\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    res.render('thankyou', { name, email, submittedAt });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Something went wrong. Try again later.');
  }
});

// Route usage
app.use(authRoutes);
app.use(dashboardRoutes.router); // if exported with `{ router }`
app.use(bookingRoutes);
app.use(staticRoutes);
app.use('/api', bookingRoutes);
// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <h2>404 - Page Not Found</h2>
    <p>This page doesn't exist.</p>
    <a href="/">Go to Home</a>
  `);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Internal error:', err);
  res.status(500).send(`
    <h2>500 - Server Error</h2>
    <p>Something went wrong.</p>
    <a href="/">Go to Home</a>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
