const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { resetTickets, findTicketById, getTickets } = require('../src/data/tickets');
const { resetBookings, getBookings } = require('../src/data/bookings');

describe('Ticket Booking API Test Suite', () => {
  beforeEach(() => {
    // Khởi tạo lại trạng thái dữ liệu trước mỗi test case để đảm bảo tính độc lập
    resetTickets();
    resetBookings();
  });

  // Test 1: Đặt vé hợp lệ
  test('1. Đặt vé hợp lệ thành công (HTTP 201)', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 1, quantity: 2 });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Đặt vé thành công');
    assert.ok(res.body.data.bookingId);
    assert.equal(res.body.data.ticketId, 1);
    assert.equal(res.body.data.ticketName, 'Vé VinWonders');
    assert.equal(res.body.data.quantity, 2);
    assert.equal(res.body.data.unitPrice, 750000);
    assert.equal(res.body.data.totalAmount, 1500000);
    // 10% của 1.500.000 là 150.000 (< 200.000 trần)
    assert.equal(res.body.data.discountAmount, 150000);
    assert.equal(res.body.data.finalAmount, 1350000);
    assert.equal(res.body.data.status, 'CONFIRMED');
    assert.ok(new Date(res.body.data.createdAt).getTime() > 0);
  });

  // Test 2: ticketId không tồn tại
  test('2. Trả về HTTP 404 khi ticketId không tồn tại', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 9999, quantity: 1 });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Vé không tồn tại');
  });

  // Test 3: quantity bằng 0
  test('3. Trả về HTTP 400 khi quantity bằng 0', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 1, quantity: 0 });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /số nguyên dương/i);
  });

  // Test 4: quantity là số âm
  test('4. Trả về HTTP 400 khi quantity là số âm', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 1, quantity: -2 });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /số nguyên dương/i);
  });

  // Test 5: quantity là số thập phân
  test('5. Trả về HTTP 400 khi quantity là số thập phân', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 1, quantity: 1.5 });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /số nguyên dương/i);
  });

  // Test 6: quantity là chuỗi
  test('6. Trả về HTTP 400 khi quantity hoặc ticketId là chuỗi hoặc không hợp lệ', async () => {
    const resQuantityString = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 1, quantity: '2' });

    assert.equal(resQuantityString.status, 400);
    assert.equal(resQuantityString.body.success, false);

    const resTicketIdString = await request(app)
      .post('/api/bookings')
      .send({ ticketId: '1', quantity: 2 });

    assert.equal(resTicketIdString.status, 400);
    assert.equal(resTicketIdString.body.success, false);

    const resMissing = await request(app)
      .post('/api/bookings')
      .send({ ticketId: null, quantity: 2 });

    assert.equal(resMissing.status, 400);
    assert.equal(resMissing.body.success, false);
  });

  // Test 7: quantity vượt quá tồn kho
  test('7. Trả về HTTP 409 khi quantity vượt quá tồn kho', async () => {
    // Vé Safari (id: 2) có stock ban đầu là 3
    const res = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 2, quantity: 5 });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Số lượng vé không đủ');
    assert.equal(res.body.availableStock, 3);
  });

  // Test 8: Đặt vé đúng bằng số lượng tồn kho
  test('8. Đặt vé thành công khi quantity đúng bằng tồn kho (stock về 0)', async () => {
    // Vé Safari (id: 2) có stock = 3
    const res = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 2, quantity: 3 });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.quantity, 3);

    // Kiểm tra tồn kho sau khi đặt
    const ticket = findTicketById(2);
    assert.equal(ticket.stock, 0);
  });

  // Test 9: Đặt vé sau khi tồn kho đã hết
  test('9. Trả về HTTP 409 khi đặt vé sau khi tồn kho đã hết (stock = 0)', async () => {
    // Đặt hết 3 vé của Safari
    await request(app)
      .post('/api/bookings')
      .send({ ticketId: 2, quantity: 3 });

    // Tiếp tục đặt thêm 1 vé
    const res = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 2, quantity: 1 });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Số lượng vé không đủ');
    assert.equal(res.body.availableStock, 0);
  });

  // Test 10: Tổng tiền dưới 1.000.000 VNĐ không được giảm giá
  test('10. Tổng tiền dưới 1.000.000 VNĐ không được giảm giá (discount = 0)', async () => {
    // Vé Safari (id: 2) giá 650.000 VNĐ, mua 1 vé -> total = 650.000
    const res = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 2, quantity: 1 });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.totalAmount, 650000);
    assert.equal(res.body.data.discountAmount, 0);
    assert.equal(res.body.data.finalAmount, 650000);
  });

  // Test 11: Tổng tiền >= 1.000.000 VNĐ được giảm 10%, tối đa 200.000 VNĐ
  test('11. Tổng tiền >= 1.000.000 VNĐ được giảm 10%, tối đa 200.000 VNĐ', async () => {
    // Trường hợp 1: 10% chưa chạm trần (Mua 2 vé Safari: 650.000 * 2 = 1.300.000 VNĐ -> giảm 10% = 130.000 VNĐ)
    const res1 = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 2, quantity: 2 });

    assert.equal(res1.status, 201);
    assert.equal(res1.body.data.totalAmount, 1300000);
    assert.equal(res1.body.data.discountAmount, 130000);
    assert.equal(res1.body.data.finalAmount, 1170000);

    // Reset lại để test trường hợp chạm trần 200.000 VNĐ
    resetTickets();
    resetBookings();

    // Trường hợp 2: 10% vượt trần 200.000 (Mua 3 vé VinWonders: 750.000 * 3 = 2.250.000 VNĐ -> 10% là 225.000 VNĐ, trần là 200.000 VNĐ)
    const res2 = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 1, quantity: 3 });

    assert.equal(res2.status, 201);
    assert.equal(res2.body.data.totalAmount, 2250000);
    assert.equal(res2.body.data.discountAmount, 200000);
    assert.equal(res2.body.data.finalAmount, 2050000);
  });

  // Test 12: Tồn kho được trừ chính xác sau khi đặt thành công
  test('12. Tồn kho được trừ chính xác sau khi đặt thành công', async () => {
    const ticketBefore = findTicketById(1);
    assert.equal(ticketBefore.stock, 5);

    await request(app)
      .post('/api/bookings')
      .send({ ticketId: 1, quantity: 2 });

    const ticketAfter = findTicketById(1);
    assert.equal(ticketAfter.stock, 3);
  });

  // Test 13: Đặt vé thất bại không làm thay đổi tồn kho
  test('13. Đặt vé thất bại không làm thay đổi tồn kho', async () => {
    const ticketBefore = findTicketById(1);
    assert.equal(ticketBefore.stock, 5);

    // Gửi request quá số lượng
    await request(app)
      .post('/api/bookings')
      .send({ ticketId: 1, quantity: 10 });

    const ticketAfter = findTicketById(1);
    assert.equal(ticketAfter.stock, 5);
  });

  // Test 14: Gửi thêm trường price giả mạo không làm thay đổi giá tính toán
  test('14. Gửi kèm giá giả mạo (price) bị bỏ qua, tính đúng theo giá trên backend', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({
        ticketId: 1,
        quantity: 1,
        price: 1000,
        unitPrice: 500,
        totalAmount: 1000
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.unitPrice, 750000);
    assert.equal(res.body.data.totalAmount, 750000);
    assert.equal(res.body.data.finalAmount, 750000);
  });

  // Test 15: bookingId không trùng nhau giữa các đơn hàng
  test('15. bookingId là duy nhất (không trùng nhau giữa các đơn)', async () => {
    const res1 = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 1, quantity: 1 });

    const res2 = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 1, quantity: 1 });

    assert.notEqual(res1.body.data.bookingId, res2.body.data.bookingId);
  });

  // Test 16: Đơn hàng được lưu đúng và có trạng thái CONFIRMED
  test('16. Đơn hàng được lưu đúng trong danh sách và có status CONFIRMED', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ ticketId: 1, quantity: 1 });

    assert.equal(res.status, 201);
    const createdBookingId = res.body.data.bookingId;

    // Kiểm tra thông qua GET /api/bookings
    const getRes = await request(app).get('/api/bookings');
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.success, true);
    assert.equal(Array.isArray(getRes.body.data), true);
    assert.equal(getRes.body.data.length, 1);

    const savedOrder = getRes.body.data[0];
    assert.equal(savedOrder.bookingId, createdBookingId);
    assert.equal(savedOrder.status, 'CONFIRMED');
    assert.equal(savedOrder.ticketId, 1);
  });

  // Test bổ sung: GET /api/tickets trả về danh sách vé với tồn kho hiện tại
  test('17. API GET /api/tickets trả về danh sách vé đầy đủ', async () => {
    const res = await request(app).get('/api/tickets');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.data[0].name, 'Vé VinWonders');
    assert.equal(res.body.data[1].name, 'Vé Safari');
  });
});

