const bookingService = require('../services/booking.service');

/**
 * Controller xử lý tạo đặt vé (POST /api/bookings)
 */
function handleBooking(req, res, next) {
  try {
    const { ticketId, quantity } = req.body || {};
    const booking = bookingService.createBooking({ ticketId, quantity });

    return res.status(201).json({
      success: true,
      message: 'Đặt vé thành công',
      data: booking
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller lấy danh sách vé (GET /api/tickets)
 */
function handleGetTickets(req, res, next) {
  try {
    const tickets = bookingService.getAllTickets();
    return res.status(200).json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller lấy danh sách đơn đặt vé (GET /api/bookings)
 */
function handleGetBookings(req, res, next) {
  try {
    const bookings = bookingService.getAllBookings();
    return res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleBooking,
  handleGetTickets,
  handleGetBookings
};

