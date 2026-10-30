# Ticket Booking REST API

Hệ thống API đặt vé (Ticket Booking API) được xây dựng bằng **Node.js** và **Express.js**, quản lý dữ liệu vé và đơn hàng giả lập trong bộ nhớ (In-memory), có cơ chế kiểm tra dữ liệu đầu vào nghiêm ngặt, quản lý tồn kho, tính toán tiền theo giá backend cố định và áp dụng chính sách giảm giá tự động.

Dự án được thiết kế theo cấu trúc phân tầng rõ ràng (Routes - Controllers - Services - Data - Utils), tuân thủ chuẩn RESTful API, phù hợp cho bài test tuyển dụng và dễ dàng giải thích trong các buổi phỏng vấn kỹ thuật.

---

## 1. Công nghệ sử dụng

- **Runtime:** Node.js (hỗ trợ Node 18+)
- **Framework:** Express.js 4.x
- **Lưu trữ dữ liệu:** In-Memory (JavaScript Array & Object trong RAM)
- **Module System:** CommonJS (`require` / `module.exports`)
- **Testing:** Node.js Built-in Test Runner (`node:test`, `node:assert/strict`) & Supertest (HTTP assertions)
- **ID Generator:** `crypto.randomUUID()` (Node.js built-in)

---

## 2. Cấu trúc thư mục

```text
ticket-booking-api/
├── src/
│   ├── controllers/
│   │   └── booking.controller.js  # Nhận request, gọi service, trả về HTTP response
│   ├── services/
│   │   └── booking.service.js     # Chứa toàn bộ nghiệp vụ (validate, trừ tồn kho, tạo đơn)
│   ├── routes/
│   │   └── booking.routes.js      # Khai báo các endpoints RESTful
│   ├── data/
│   │   ├── tickets.js             # Dữ liệu vé ban đầu và hàm truy xuất/reset
│   │   └── bookings.js            # Danh sách đơn hàng in-memory và hàm truy xuất/reset
│   ├── utils/
│   │   └── discount.js            # Module tính toán số tiền giảm giá theo chính sách
│   └── app.js                     # Cấu hình Express, JSON middleware & Centralized Error Handler
├── tests/
│   ├── booking.test.js            # Toàn bộ 17 automated test cases cho API đặt vé
│   └── discount.test.js           # Unit tests kiểm thử biên cho logic giảm giá
├── .gitignore                     # Bỏ qua node_modules, log, file tạm
├── package.json                   # Cấu hình dự án và dependencies
├── server.js                      # Entry point khởi động HTTP server
└── README.md                      # Tài liệu hướng dẫn chi tiết
```

---

## 3. Dữ liệu vé ban đầu

Khi server khởi động, danh sách vé được nạp sẵn vào bộ nhớ:

| ID | Tên vé | Giá vé (VNĐ) | Tồn kho ban đầu |
|:---|:---|:---|:---|
| `1` | Vé VinWonders | 750.000 | 5 |
| `2` | Vé Safari | 650.000 | 3 |

> **Lưu ý:** Vì dữ liệu được lưu trên bộ nhớ RAM (in-memory), toàn bộ đơn hàng và số lượng tồn kho đã thay đổi sẽ trở về trạng thái ban đầu mỗi khi restart server.

---

## 4. Hướng dẫn cài đặt & Chạy ứng dụng

### 4.1. Yêu cầu môi trường
- Đã cài đặt **Node.js** (khuyến nghị phiên bản 18, 20 hoặc 24 trở lên) và **npm**.

### 4.2. Cài đặt dependencies
Chạy lệnh sau tại thư mục gốc của project:
```bash
npm install
```

### 4.3. Chạy Server ở môi trường Development / Production

- **Chạy server thông thường:**
  ```bash
  npm start
  ```
- **Chạy server chế độ watch (tự reload khi sửa code, Node 18+):**
  ```bash
  npm run dev
  ```

Server sẽ lắng nghe tại cổng `3000` (mặc định) hoặc cổng được cấu hình trong biến môi trường `PORT`:
```text
Server đang chạy tại http://localhost:3000
```

---

## 5. Danh sách API & Chi tiết quy trình xử lý

### 5.1. API Đặt vé (Chính)
- **Endpoint:** `POST /api/bookings`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "ticketId": 1,
    "quantity": 2
  }
  ```

#### Quy trình xử lý 8 bước bắt buộc trên Backend:
1. **Kiểm tra dữ liệu đầu vào:**
   - `ticketId` và `quantity` phải là số nguyên dương (`Number.isInteger() && value > 0`).
   - Bắt lỗi khi thiếu trường, gửi null, số âm, số 0, số thực hoặc kiểu string (trả về **HTTP 400**).
2. **Kiểm tra vé tồn tại:**
   - Tìm vé theo `ticketId`. Nếu không tìm thấy, trả về **HTTP 404** ("Vé không tồn tại").
3. **Kiểm tra tồn kho:**
   - So sánh `quantity` với `ticket.stock`. Nếu không đủ, trả về **HTTP 409** ("Số lượng vé không đủ", kèm `availableStock`). Không thay đổi tồn kho khi thất bại.
4. **Tính tổng tiền:**
   - `totalAmount = ticket.price * quantity`.
   - Giá được lấy cố định từ backend, bỏ qua mọi trường giá giả mạo do client gửi lên.
5. **Áp dụng chính sách giảm giá:**
   - Nếu `totalAmount < 1.000.000 VNĐ`: `discountAmount = 0`.
   - Nếu `totalAmount >= 1.000.000 VNĐ`: Giảm 10% giá trị đơn hàng, nhưng tối đa `200.000 VNĐ` (`Math.min(Math.round(totalAmount * 0.1), 200000)`).
   - `finalAmount = totalAmount - discountAmount`.
6. **Tạo đơn hàng:**
   - Sinh `bookingId` duy nhất qua `crypto.randomUUID()`.
   - Đặt trạng thái `status: "CONFIRMED"`.
   - Ghi nhận `createdAt` theo thời gian thực ISO UTC của server.
7. **Cập nhật tồn kho:**
   - Giảm tồn kho: `ticket.stock -= quantity`. Đảm bảo tồn kho không bao giờ âm.
   - Thêm đơn hàng vào danh sách `bookings`.
8. **Trả về kết quả:**
   - Trả về mã **HTTP 201 Created** cùng đầy đủ thông tin đơn hàng.

---

### 5.2. API Lấy danh sách vé & Tồn kho hiện tại (Bổ trợ)
- **Endpoint:** `GET /api/tickets`
- **HTTP Status:** `200 OK`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Vé VinWonders",
        "price": 750000,
        "stock": 3
      },
      {
        "id": 2,
        "name": "Vé Safari",
        "price": 650000,
        "stock": 3
      }
    ]
  }
  ```

---

### 5.3. API Lấy danh sách đơn đặt vé đã tạo (Bổ trợ)
- **Endpoint:** `GET /api/bookings`
- **HTTP Status:** `200 OK`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "bookingId": "c89b35cf-1d8f-4da9-bd3f-763428d08cb7",
        "ticketId": 1,
        "ticketName": "Vé VinWonders",
        "quantity": 2,
        "unitPrice": 750000,
        "totalAmount": 1500000,
        "discountAmount": 150000,
        "finalAmount": 1350000,
        "status": "CONFIRMED",
        "createdAt": "2026-10-30T08:05:00.000Z"
      }
    ]
  }
  ```

---

## 6. Chuẩn hóa mã phản hồi và thông báo lỗi

Tất cả phản hồi lỗi đều tuân thủ định dạng thống nhất:
```json
{
  "success": false,
  "message": "Mô tả lỗi cụ thể"
}
```

Các mã HTTP status tương ứng:
- **`201 Created`**: Đặt vé thành công.
- **`200 OK`**: Lấy danh sách dữ liệu thành công.
- **`400 Bad Request`**: Dữ liệu gửi lên không hợp lệ (sai kiểu, âm, bằng 0, số thực, thiếu trường, JSON sai cú pháp).
- **`404 Not Found`**: Vé không tồn tại hoặc sai đường dẫn API.
- **`409 Conflict`**: Số lượng vé yêu cầu vượt quá số lượng còn lại trong kho.
- **`500 Internal Server Error`**: Lỗi hệ thống ngoài dự kiến (ẩn chi tiết kỹ thuật/stack trace khỏi client).

---

## 7. Hướng dẫn kiểm thử thủ công (curl / PowerShell)

### 7.1. Đặt vé thành công (áp dụng giảm giá 10%, ví dụ 150.000 VNĐ)
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d "{\"ticketId\": 1, \"quantity\": 2}"
```
*Kết quả:*
```json
{
  "success": true,
  "message": "Đặt vé thành công",
  "data": {
    "bookingId": "fe855e37-9759-4d69-a3b0-ffae2f9136ca",
    "ticketId": 1,
    "ticketName": "Vé VinWonders",
    "quantity": 2,
    "unitPrice": 750000,
    "totalAmount": 1500000,
    "discountAmount": 150000,
    "finalAmount": 1350000,
    "status": "CONFIRMED",
    "createdAt": "2026-10-30T08:00:00.000Z"
  }
}
```

### 7.2. Kiểm tra lỗi dữ liệu đầu vào không hợp lệ (HTTP 400)
```bash
# Quantity là số âm
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d "{\"ticketId\": 1, \"quantity\": -1}"

# Quantity là chuỗi
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d "{\"ticketId\": 1, \"quantity\": \"2\"}"
```

### 7.3. Kiểm tra lỗi vé không tồn tại (HTTP 404)
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d "{\"ticketId\": 999, \"quantity\": 1}"
```

### 7.4. Kiểm tra lỗi vượt quá tồn kho (HTTP 409)
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d "{\"ticketId\": 2, \"quantity\": 10}"
```
*Kết quả:*
```json
{
  "success": false,
  "message": "Số lượng vé không đủ",
  "availableStock": 3
}
```

---

## 8. Chạy Automated Tests

Dự án sử dụng **Node.js Built-in Test Runner** kết hợp với **Supertest**, bao gồm đầy đủ 16 yêu cầu kiểm thử nghiệp vụ và các bài kiểm tra phụ trợ.

Chạy lệnh test:
```bash
npm test
```

### Danh sách các kịch bản test đã được cài đặt:
1. Đặt vé hợp lệ thành công (HTTP 201).
2. Trả về HTTP 404 khi `ticketId` không tồn tại.
3. Trả về HTTP 400 khi `quantity` bằng 0.
4. Trả về HTTP 400 khi `quantity` là số âm.
5. Trả về HTTP 400 khi `quantity` là số thập phân.
6. Trả về HTTP 400 khi `quantity` hoặc `ticketId` là chuỗi, null hoặc thiếu trường.
7. Trả về HTTP 409 khi `quantity` vượt quá tồn kho hiện có.
8. Đặt vé đúng bằng số lượng tồn kho (tồn kho giảm về 0 thành công).
9. Trả về HTTP 409 khi đặt vé sau khi tồn kho đã hết (stock = 0).
10. Tổng tiền dưới 1.000.000 VNĐ không được giảm giá (`discountAmount = 0`).
11. Tổng tiền bằng hoặc lớn hơn 1.000.000 VNĐ được giảm 10%, tối đa 200.000 VNĐ.
12. Tồn kho được trừ chính xác sau khi đặt thành công.
13. Đặt vé thất bại không làm thay đổi tồn kho ban đầu.
14. Gửi kèm giá giả mạo trong request body bị bỏ qua, tính đúng theo giá backend.
15. `bookingId` là duy nhất giữa các lần đặt đơn.
16. Đơn hàng được lưu đúng vào bộ nhớ và có trạng thái `CONFIRMED`.
17. Unit test kiểm thử biên cho chính sách giảm giá (`discount.test.js`).

---

## 9. Phân tích kiến trúc & Hạn chế của In-Memory Storage

### 9.1. Hạn chế của In-Memory Storage
1. **Mất dữ liệu khi Server Restart / Crash:** Do dữ liệu chỉ tồn tại trên RAM của tiến trình Node.js, mọi dữ liệu biến mất khi tiến trình kết thúc.
2. **Không Scale ngang (Horizontal Scaling) được:** Khi chạy nhiều Node.js instances (dưới Load Balancer như Nginx hoặc PM2 cluster), mỗi process sẽ có một vùng nhớ riêng biệt, dẫn đến dữ liệu không đồng nhất (data inconsistency).
3. **Nguy cơ Race Condition khi xử lý đồng thời:** Trong JavaScript đơn luồng (Single Thread Event Loop), các tác vụ đồng bộ diễn ra tuần tự. Tuy nhiên, khi chuyển sang database thực tế có I/O bất đồng bộ (async), nếu 2 request cùng đọc một bản ghi có `stock = 1`, cả 2 đều thấy đủ hàng và cùng trừ kho, gây ra hiện tượng **bán vượt tồn kho (Overbooking)**.

### 9.2. Phương án giải quyết khi chuyển sang Database thật
Khi chuyển sang hệ quản trị cơ sở dữ liệu (PostgreSQL / MySQL):
1. **Sử dụng Database Transaction & Pessimistic Locking:**
   ```sql
   BEGIN TRANSACTION;
   SELECT stock FROM tickets WHERE id = 1 FOR UPDATE;
   -- Kiểm tra tồn kho, nếu đủ thì trừ kho:
   UPDATE tickets SET stock = stock - 2 WHERE id = 1;
   INSERT INTO bookings (...);
   COMMIT;
   ```
   Cơ chế `FOR UPDATE` khóa dòng dữ liệu của vé cho đến khi giao dịch hoàn tất, ngăn chặn hoàn toàn tranh chấp từ các request khác.

2. **Sử dụng Atomic Update (Optimistic Condition):**
   ```sql
   UPDATE tickets SET stock = stock - 2 WHERE id = 1 AND stock >= 2;
   ```
   Kiểm tra số dòng bị ảnh hưởng (`affectedRows`). Nếu bằng 0, báo lỗi không đủ tồn kho mà không cần khóa bảng lâu.

3. **Với hệ thống phân tán chịu tải cao (High Concurrency / Flash Sale):**
   - Đặt **Redis** làm tầng kiểm soát tồn kho phía trước. Sử dụng Redis atomic operations (`DECRBY`) hoặc Lua script để trừ kho nhanh chóng với độ trễ cực thấp.
   - Sử dụng **Message Queue** (RabbitMQ / Kafka) để xếp hàng đơn hàng và ghi bất đồng bộ vào cơ sở dữ liệu chính.

