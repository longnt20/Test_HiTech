const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  console.log('Lưu ý: Dữ liệu vé và đơn hàng được lưu trên RAM (in-memory) và sẽ reset khi khởi động lại server.');
  console.log(`- POST http://localhost:${PORT}/api/bookings (Đặt vé)`);
  console.log(`- GET  http://localhost:${PORT}/api/tickets  (Danh sách vé & tồn kho)`);
  console.log(`- GET  http://localhost:${PORT}/api/bookings (Danh sách đơn đã tạo)`);
});

