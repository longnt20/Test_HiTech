const crypto = require('crypto');
const { getTickets, findTicketById } = require('../data/tickets');
const { getBookings, addBooking } = require('../data/bookings');
const { calculateDiscount } = require('../utils/discount');

/**
 * Custom error class để gắn HTTP status code vào error object
 */
class ServiceError extends Error {
  constructor(message, statusCode, extra = {}) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    Object.assign(this, extra);
  }
}

/**
 * Kiểm tra tính hợp lệ của dữ liệu đầu vào khi đặt vé
 * - ticketId: số nguyên dương
 * - quantity: số nguyên dương (không 0, không âm, không số thực, không chuỗi, không null)
 */
function validateBookingInput({ ticketId, quantity }) {
  if (ticketId === undefined || ticketId === null) {
    throw new ServiceError('Trường ticketId là bắt buộc', 400);
  }

  if (typeof ticketId !== 'number' || !Number.isInteger(ticketId) || ticketId <= 0) {
    throw new ServiceError('Mã vé (ticketId) phải là số nguyên dương', 400);
  }

  if (quantity === undefined || quantity === null) {
    throw new ServiceError('Trường quantity là bắt buộc', 400);
  }

  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    throw new ServiceError('Số lượng vé (quantity) phải là số nguyên dương', 400);
  }
}

/**
 * Xử lý nghiệp vụ đặt vé
 * @param {object} payload - { ticketId, quantity }
 * @returns {object} Thông tin đơn hàng đã tạo
 */
function createBooking({ ticketId, quantity }) {
  // Bước 1: Kiểm tra tính hợp lệ của dữ liệu đầu vào
  validateBookingInput({ ticketId, quantity });

  // Bước 2: Kiểm tra vé tồn tại
  const ticket = findTicketById(ticketId);
  if (!ticket) {
    throw new ServiceError('Vé không tồn tại', 404);
  }

  // Bước 3: Kiểm tra tồn kho
  if (quantity > ticket.stock) {
    throw new ServiceError('Số lượng vé không đủ', 409, { availableStock: ticket.stock });
  }

  // Bước 4: Tính tổng tiền (giá lấy từ Backend, bỏ qua bất kỳ trường price giả mạo nào từ client)
  const totalAmount = ticket.price * quantity;

  // Bước 5: Áp dụng chính sách giảm giá
  const discountAmount = calculateDiscount(totalAmount);
  const finalAmount = totalAmount - discountAmount;

  // Bước 6: Tạo đơn hàng
  const booking = {
    bookingId: crypto.randomUUID(),
    ticketId: ticket.id,
    ticketName: ticket.name,
    quantity,
    unitPrice: ticket.price,
    totalAmount,
    discountAmount,
    finalAmount,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  };

  // Bước 7: Cập nhật tồn kho và lưu đơn hàng
  // Chỉ trừ kho khi tất cả bước trên đã hợp lệ
  ticket.stock -= quantity;
  addBooking(booking);

  return booking;
}

/**
 * Lấy danh sách vé hiện tại (kèm giá và tồn kho thực tế)
 */
function getAllTickets() {
  return getTickets();
}

/**
 * Lấy danh sách các đơn hàng đã tạo
 */
function getAllBookings() {
  return getBookings();
}

module.exports = {
  createBooking,
  getAllTickets,
  getAllBookings,
  validateBookingInput,
  ServiceError
};

