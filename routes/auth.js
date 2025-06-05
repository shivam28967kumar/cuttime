const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const validator = require('validator');
const { safeReadJSON, safeWriteJSON } = require('../utils/fileHelpers');
const { sendOtpEmail } = require('../utils/mailer');

const router = express.Router();

const otpStore = new Map(); // temp store: email -> { otp, timestamp, data }

// Render register page
router.get('/register', (req, res) => {
  res.render('register');
});

router.get('/verify', (req, res) => {
  res.render('verify');
});
// Render login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Render other pages
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.send('<h2>Error logging out.</h2><a href="/dashboard">Back to Dashboard</a>');
    }

    res.clearCookie('connect.sid'); // clear session cookie
    res.render('logout'); // show logout.ejs page
  });
});
router.get('/bookslot', (req, res) => res.render('bookslot'));
router.get('/home', (req, res) => res.render('home'));
router.get('/thankyou', (req, res) => res.render('thankyou'));
router.get('/contact', (req, res) => res.render('contact'));

// Handle registration POST
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

    // Read existing users
    const filePath = path.join(__dirname, '..', 'registrations.json');
    const registrations = await safeReadJSON(filePath);

    // Check if user already exists
    if (registrations.find(u => u.email === email)) {
      return res.status(400).send('<h2>Email already registered.</h2><a href="/register">Try Again</a>');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP & user data temporarily
    otpStore.set(email, {
      otp,
      timestamp: Date.now(),
      data: { name, email, password: hashedPassword, verified: true }
    });

   // console.log(`Sending OTP ${otp} to ${email}`);
   // console.log(`OTP is ${otp}`);

    await sendOtpEmail(email, otp);
    res.render('verify', { email });

  } catch (err) {
    console.error('Registration error:', err.stack);
    res.status(500).send('<h2>Server error during registration.</h2><a href="/register">Try Again</a>');
  }
});

// Verify OTP POST
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  const stored = otpStore.get(email);
  if (!stored) {
    return res.status(400).send('<h2>No OTP found or expired.</h2><a href="/register">Register Again</a>');
  }

  const { otp: realOtp, timestamp, data } = stored;

  if (Date.now() - timestamp > 5 * 60 * 1000) {
    otpStore.delete(email);
    return res.status(400).send('<h2>OTP expired. Please register again.</h2><a href="/register">Try Again</a>');
  }

  if (otp !== realOtp) {
    return res.status(400).send('<h2>Incorrect OTP.</h2><a href="/register">Try Again</a>');
  }

  try {
    const filePath = path.join(__dirname, '..', 'registrations.json');
    const registrations = await safeReadJSON(filePath);

    registrations.push(data);
    await safeWriteJSON(filePath, registrations);

    otpStore.delete(email);

    res.send('<h2>Registration Complete! You may now <a href="/login">Login</a>.</h2>');
  } catch (error) {
    console.error('Saving user failed:', error);
    res.status(500).send('<h2>Failed to save user.</h2><a href="/register">Try Again</a>');
  }
});
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  const stored = otpStore.get(email);

  if (!stored) {
    return res.status(400).send('<h2>Session expired. Please register again.</h2><a href="/register">Register</a>');
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, {
    ...stored,
    otp: newOtp,
    timestamp: Date.now(),
  });

  try {
    await sendOtpEmail(email, newOtp);
    res.render('verify', { email });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).send('<h2>Failed to resend OTP. Try again later.</h2>');
  }
});


// Login POST
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
    if (!user) {
      return res.status(400).send('<h2>Invalid email or password.</h2><a href="/login">Try Again</a>');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send('<h2>Invalid email or password.</h2><a href="/login">Try Again</a>');
    }

    if (!user.verified) {
      return res.status(403).send('<h2>Please verify your email first.</h2><a href="/login">Back to Login</a>');
    }

    // Save user session
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

module.exports = router;
