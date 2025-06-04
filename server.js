require('dotenv').config(); 
const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes correctly
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const bookingRoutes = require('./routes/bookings');
const staticRoutes = require('./routes/static');


const nodemailer = require('nodemailer');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'cuttime_secret_key',
  resave: false,
  saveUninitialized: true
}));
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  console.log('Contact form submitted:', { name, email, message });
  const submittedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });

  // Create transporter
  let transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email content
  let mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.EMAIL_USER,
    subject: `New Contact Form Message from ${name}`,
    text: `You received a new message from your website contact form.\n\n` +
          `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    // Only render the thank you page once
    res.render('thankyou', { name, email, submittedAt });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Oops! Something went wrong. Please try again later.');
  }
});


// Use routes correctly
app.use(authRoutes);
app.use(dashboardRoutes.router); // if exported as { router }
app.use(bookingRoutes);
app.use(staticRoutes);

// 404 Not Found Handler (for undefined routes)
app.use((req, res) => {
  res.status(404).send(`
    <h2>404 - Page Not Found</h2>
    <p>The page you are looking for doesn't exist.</p>
    <a href="/">Go to Home</a>
  `);
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error('Internal server error:', err);
  res.status(500).send(`
    <h2>500 - Internal Server Error</h2>
    <p>Something went wrong.</p>
    <a href="/">Go to Home</a>
  `);
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
