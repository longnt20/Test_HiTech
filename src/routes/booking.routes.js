const express = require('express');
const {
  handleBooking,
  handleGetTickets,
  handleGetBookings
} = require('../controllers/booking.controller');

const router = express.Router();

// API đặt vé chính
router.post('/bookings', handleBooking);

// API phụ trợ kiểm tra dữ liệu
router.get('/tickets', handleGetTickets);
router.get('/bookings', handleGetBookings);

module.exports = router;

