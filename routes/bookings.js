const express = require('express');
const path = require('path');
const { safeReadJSON, safeWriteJSON } = require('../utils/fileHelpers');

const router = express.Router();

const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).send(`
      <h2>Unauthorized</h2>
      <p>Please <a href="/login">login</a> to access this page.</p>
    `);
  }
  next();
};

// Book a slot
router.post('/bookslot', requireLogin, async (req, res) => {
  try {
    const salon = req.body.salon?.trim();
    const date = req.body.date?.trim();
    const time = req.body.time?.trim();

    if (!salon || !date || !time) {
      return res.status(400).send('<h2>Please provide salon, date, and time.</h2><a href="/bookslot">Try Again</a>');
    }

    const filePath = path.join(__dirname, '..', 'bookings.json');
    const bookings = await safeReadJSON(filePath);

    const booking = {
      id: Date.now(),
      salon,
      date,
      time,
      userEmail: req.session.user.email,
      createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    await safeWriteJSON(filePath, bookings);

    res.send(`
      <h2>Booking Saved!</h2>
      <p>Salon: ${salon}</p>
      <p>Date: ${date}</p>
      <p>Time: ${time}</p>
      <a href="/home">Back to Home</a>
    `);
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).send('<h2>Server error saving booking.</h2><a href="/bookslot">Try Again</a>');
  }
});

// View all bookings
router.get('/bookings', requireLogin, async (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'bookings.json');
    const bookings = await safeReadJSON(filePath);

    if (bookings.length === 0) return res.send('<h2>No bookings found.</h2><a href="/home">Back</a>');

    const list = bookings.map((b, i) =>
      `<li>Booking ${i + 1}: ${b.salon}, ${b.date}, ${b.time} (by ${b.userEmail || 'unknown'}) 
      - <a href="/cancelbooking?id=${b.id}">Cancel</a></li>`
    ).join('');
    res.send(`<h2>Bookings</h2><ul>${list}</ul><a href="/home">Back</a>`);
  } catch (error) {
    console.error('View bookings error:', error);
    res.status(500).send('<h2>Server error loading bookings.</h2><a href="/home">Back</a>');
  }
});

// Cancel booking by id
router.get('/cancelbooking', requireLogin, async (req, res) => {
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).send('<h2>Invalid booking ID.</h2><a href="/bookings">Back</a>');

    const filePath = path.join(__dirname, '..', 'bookings.json');
    let bookings = await safeReadJSON(filePath);

    const bookingIndex = bookings.findIndex(b => b.id === id && b.userEmail === req.session.user.email);
    if (bookingIndex === -1) {
      return res.status(404).send('<h2>Booking not found or not authorized to cancel.</h2><a href="/bookings">Back</a>');
    }

    bookings.splice(bookingIndex, 1);
    await safeWriteJSON(filePath, bookings);

    res.send('<h2>Booking cancelled successfully.</h2><a href="/bookings">Back to Bookings</a>');
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).send('<h2>Server error cancelling booking.</h2><a href="/bookings">Back</a>');
  }
});

module.exports = router;
