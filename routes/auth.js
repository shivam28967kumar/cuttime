const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');
const validator = require('validator');
const { safeReadJSON, safeWriteJSON } = require('../utils/fileHelpers');
const { sendVerificationEmail } = require('../utils/mailer');

const router = express.Router();

// Render register page
router.get('/register', (req, res) => {
  res.render('register');
});


// Render login page

// ✅ Use EJS view
router.get('/login', (req, res) => {
  res.render('login'); // looks in views/login.ejs
});
router.get('/logout', (req, res) => {
  res.render('logout'); // looks in views/login.ejs
});
router.get('/bookslot', (req, res) => {
  res.render('bookslot');
});

router.get('/home', (req, res) => {
  res.render('home');
});
router.get('/thankyou', (req, res) => {
  res.render('thankyou');
});
router.get('/contact', (req, res) => {
  res.render('contact');
});
// Handle registration
router.post('/register', async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).send('<h2>All fields are required.</h2><a href="/register">Try Again</a>');
    }

    if (!validator.isEmail(email)) {
      return res.status(400).send('<h2>Invalid email format.</h2><a href="/register">Try Again</a>');
    }

    const filePath = path.join(__dirname, '..', 'registrations.json');
    const registrations = await safeReadJSON(filePath);

    const existingUser = registrations.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).send('<h2>Email already registered.</h2><a href="/register">Try Again</a>');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(20).toString('hex');

    registrations.push({
      name,
      email,
      password: hashedPassword,
      verified: false,
      token
    });

    await safeWriteJSON(filePath, registrations);
    await sendVerificationEmail(email, token);

    res.send(`
      <h2>Check your email</h2>
      <p>A verification link has been sent to ${email}</p>
      <a href="/login">Go to Login</a>
    `);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).send('<h2>Server error during registration.</h2><a href="/register">Try Again</a>');
  }
});

// Handle email verification
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    const filePath = path.join(__dirname, '..', 'registrations.json');
    const registrations = await safeReadJSON(filePath);

    const user = registrations.find(u => u.token === token);
    if (!user) {
      return res.status(400).send('<h2>Invalid or expired token.</h2><a href="/">Home</a>');
    }

    user.verified = true;
    delete user.token;

    await safeWriteJSON(filePath, registrations);
    res.send('<h2>Email verified!</h2><a href="/login">Login</a>');
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).send('<h2>Verification failed.</h2><a href="/">Home</a>');
  }
});

// Handle login
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).send('<h2>Email and password are required.</h2><a href="/login">Try Again</a>');
    }

    const filePath = path.join(__dirname, '..', 'registrations.json');
    const registrations = await safeReadJSON(filePath);

    const user = registrations.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send('<h2>Invalid email or password.</h2><a href="/login">Try Again</a>');
    }

    if (!user.verified) {
      return res.status(403).send('<h2>Please verify your email first.</h2><a href="/login">Back to Login</a>');
    }

    req.session.user = { name: user.name, email: user.email };
    res.send(`
      <h2>Login Successful!</h2>
      <p>Welcome, ${user.name}</p>
      <a href="/dashboard">Go to Dashboard</a>
    `);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('<h2>Server error during login.</h2><a href="/login">Try Again</a>');
  }
});

// Handle logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.send('<h2>Error logging out.</h2><a href="/dashboard">Back to Dashboard</a>');
    }
    res.redirect('/login');
  });
});

module.exports = router;
