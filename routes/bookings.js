const express = require('express');
const path = require('path');
const Booking = require('../models/Booking');

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

// Book a slot - now saving to MongoDB instead of file
router.post('/bookslot', requireLogin, async (req, res) => {
  try {
    const salon = req.body.salon?.trim();
    const date = req.body.date?.trim();
    const time = req.body.time?.trim();

    if (!salon || !date || !time) {
      return res.status(400).send('<h2>Please provide salon, date, and time.</h2><a href="/bookslot">Try Again</a>');
    }

    // Create booking document
    const newBooking = new Booking({
      userId: req.session.user._id, // session stores logged-in user
      salonName: salon,
      serviceType: 'General', // you can add a field for this in the form later
      date: date,
      timeSlot: time,
    });

    await newBooking.save();

    res.send(`
      <h2>Booking Saved to MongoDB!</h2>
      <p>Salon: ${salon}</p>
      <p>Date: ${date}</p>
      <p>Time: ${time}</p>
      <a href="/home">Back to Home</a>
    `);
  } catch (error) {
    console.error('MongoDB Booking Error:', error);
    res.status(500).send('<h2>Server error saving booking.</h2><a href="/bookslot">Try Again</a>');
  }
});

// View all bookings
router.get('/bookings', requireLogin, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.session.user._id });

    if (bookings.length === 0) {
      return res.send('<h2>No bookings found.</h2><a href="/home">Back</a>');
    }

    const list = bookings.map((b, i) =>
      `<li>Booking ${i + 1}: ${b.salonName}, ${b.date}, ${b.timeSlot} 
      - <a href="/cancelbooking?id=${b._id}">Cancel</a></li>`
    ).join('');

    res.send(<h2>Your MongoDB Bookings</h2><ul>${list}</ul><a href="/home">Back</a>);
  } catch (error) {
    console.error('MongoDB View Bookings Error:', error);
    res.status(500).send('<h2>Server error loading bookings.</h2><a href="/home">Back</a>');
  }
});

// Cancel booking by id
router.get('/cancelbooking', requireLogin, async (req, res) => {
  try {
    const bookingId = req.query.id;
    if (!bookingId) return res.status(400).send('<h2>Invalid booking ID.</h2><a href="/bookings">Back</a>');

    const deleted = await Booking.findOneAndDelete({
      _id: bookingId,
      userId: req.session.user._id,
    });

    if (!deleted) {
      return res.status(404).send('<h2>Booking not found or not authorized to cancel.</h2><a href="/bookings">Back</a>');
    }

    res.send('<h2>Booking cancelled successfully.</h2><a href="/bookings">Back to Bookings</a>');
  } catch (error) {
    console.error('MongoDB Cancel Booking Error:', error);
    res.status(500).send('<h2>Server error cancelling booking.</h2><a href="/bookings">Back</a>');
  }
});

module.exports = router;
