const express = require('express');
const bookingRoutes = require('./routes/booking.routes');

const app = express();

// Parse JSON request body
app.use(express.json());

// Xử lý lỗi nếu JSON gửi lên bị sai cú pháp (malformed JSON)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu JSON gửi lên không đúng định dạng'
    });
  }
  next(err);
});

// Khai báo các API routes
app.use('/api', bookingRoutes);

// Xử lý khi truy cập route không tồn tại (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Đường dẫn không tồn tại'
  });
});

// Middleware xử lý lỗi tập trung (Centralized Error Handler)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Lỗi server ngoài dự kiến' : err.message;

  const errorResponse = {
    success: false,
    message
  };

  // Trả thêm availableStock nếu có lỗi liên quan đến tồn kho (409)
  if (err.availableStock !== undefined) {
    errorResponse.availableStock = err.availableStock;
  }

  res.status(statusCode).json(errorResponse);
});

module.exports = app;

