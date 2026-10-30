const initialTickets = [
  {
    id: 1,
    name: "Vé VinWonders",
    price: 750000,
    stock: 5
  },
  {
    id: 2,
    name: "Vé Safari",
    price: 650000,
    stock: 3
  }
];

// Khởi tạo danh sách vé trong bộ nhớ
let tickets = initialTickets.map(ticket => ({ ...ticket }));

const getTickets = () => tickets;

const findTicketById = (id) => tickets.find(ticket => ticket.id === id);

// Hàm reset dữ liệu phục vụ testing và khởi tạo lại
const resetTickets = () => {
  tickets = initialTickets.map(ticket => ({ ...ticket }));
  return tickets;
};

module.exports = {
  getTickets,
  findTicketById,
  resetTickets
};

