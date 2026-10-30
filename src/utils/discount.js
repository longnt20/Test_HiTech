/**
 * Tính số tiền giảm giá dựa trên chính sách:
 * - Dưới 1.000.000 VNĐ: không giảm giá.
 * - Từ 1.000.000 VNĐ trở lên: giảm 10% giá trị đơn hàng, tối đa 200.000 VNĐ.
 *
 * @param {number} totalAmount - Tổng tiền đơn hàng trước giảm giá
 * @returns {number} discountAmount - Số tiền được giảm
 */
function calculateDiscount(totalAmount) {
  if (typeof totalAmount !== 'number' || totalAmount < 0) {
    return 0;
  }

  if (totalAmount < 1000000) {
    return 0;
  }

  const tenPercentDiscount = Math.round(totalAmount * 0.1);
  return Math.min(tenPercentDiscount, 200000);
}

module.exports = {
  calculateDiscount
};

