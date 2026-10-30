const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { calculateDiscount } = require('../src/utils/discount');

describe('Discount Calculation Unit Tests', () => {
  test('Đơn hàng dưới 1.000.000 VNĐ không được giảm giá', () => {
    assert.equal(calculateDiscount(0), 0);
    assert.equal(calculateDiscount(500000), 0);
    assert.equal(calculateDiscount(999999), 0);
  });

  test('Đơn hàng đúng 1.000.000 VNĐ được giảm 10% (100.000 VNĐ)', () => {
    assert.equal(calculateDiscount(1000000), 100000);
  });

  test('Đơn hàng 1.500.000 VNĐ được giảm 10% (150.000 VNĐ)', () => {
    assert.equal(calculateDiscount(1500000), 150000);
  });

  test('Đơn hàng từ 2.000.000 VNĐ trở lên chạm mức giảm trần tối đa 200.000 VNĐ', () => {
    assert.equal(calculateDiscount(2000000), 200000);
    assert.equal(calculateDiscount(3000000), 200000);
    assert.equal(calculateDiscount(5000000), 200000);
  });

  test('Đầu vào không hợp lệ hoặc số âm trả về 0', () => {
    assert.equal(calculateDiscount(-100000), 0);
    assert.equal(calculateDiscount(null), 0);
    assert.equal(calculateDiscount(undefined), 0);
    assert.equal(calculateDiscount('1000000'), 0);
  });
});

