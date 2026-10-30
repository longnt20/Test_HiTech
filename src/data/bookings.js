// Danh sách đơn hàng lưu trong bộ nhớ
let bookings = [];

const getBookings = () => bookings;

const addBooking = (booking) => {
  bookings.push(booking);
  return booking;
};

// Hàm reset dữ liệu phục vụ testing
const resetBookings = () => {
  bookings = [];
  return bookings;
};

module.exports = {
  getBookings,
  addBooking,
  resetBookings
};

