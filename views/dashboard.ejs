const express = require('express');
const path = require('path');
const { safeReadJSON } = require('../utils/fileHelpers');

const router = express.Router();

// Middleware to check login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).send(`
      <h2>Unauthorized</h2>
      <p>Please <a href="/login">login</a> to access this page.</p>
    `);
  }
  next();
}

router.get('/dashboard', requireLogin, (req, res) => {
  const { name, email } = req.session.user;
  res.send(`
    <h2>Hello, ${name} 👋</h2>
    <p>Your email: ${email}</p>
    <a href="/bookslot">Book a Slot</a> |
    <a href="/logout">Logout</a>
  `);
});

router.get('/registrations', requireLogin, async (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'registrations.json');
    const registrations = await safeReadJSON(filePath);

    if (registrations.length === 0) return res.send('<h2>No registrations found.</h2><a href="/home">Back</a>');

    const list = registrations.map((r, i) => `<li>User ${i + 1}: ${r.name} (${r.email})</li>`).join('');
    res.send(`<h2>Registrations</h2><ul>${list}</ul><a href="/home">Back</a>`);
  } catch (error) {
    console.error('View registrations error:', error);
    res.status(500).send('<h2>Server error loading registrations.</h2><a href="/home">Back</a>');
  }
});

module.exports = { router, requireLogin };
