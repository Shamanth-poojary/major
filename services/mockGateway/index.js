/**
 * services/mockGateway/index.js
 * Isolated mock payment gateway simulating modern hosted checkout (like Razorpay/Stripe).
 * Supports Card (with Luhn & OTP check), UPI, and Netbanking.
 * Signs callbacks with HMAC SHA-256.
 */

"use strict";

const crypto = require("crypto");

const GATEWAY_SECRET = process.env.SECRET || "mock_gateway_secret_key_12345";

// In-memory order registry for active mock checkout sessions
const activeOrders = new Map();

/**
 * Basic Luhn algorithm check for credit/debit card numbers.
 */
function isValidLuhn(numStr) {
  const clean = numStr.replace(/\s+/g, "");
  if (!/^\d{13,19}$/.test(clean)) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * Detect card network from card number prefix.
 */
function detectCardNetwork(numStr) {
  const clean = numStr.replace(/\s+/g, "");
  if (/^4/.test(clean)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "Mastercard";
  if (/^3[47]/.test(clean)) return "American Express";
  if (/^(6011|65|64[4-9]|622)/.test(clean)) return "Discover";
  if (/^(60|65|81|82)/.test(clean)) return "RuPay";
  return "Card";
}

/**
 * Generate HMAC signature for order/payment verification.
 */
function signPayload(data) {
  const hmac = crypto.createHmac("sha256", GATEWAY_SECRET);
  hmac.update(typeof data === "string" ? data : JSON.stringify(data));
  return hmac.digest("hex");
}

/**
 * Create a new mock gateway checkout order.
 */
function createOrder({ bookingId, amount, purpose, customerEmail }) {
  const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const signature = signPayload({ orderId, bookingId, amount: Number(amount) });

  const orderData = {
    orderId,
    bookingId: Number(bookingId),
    amount: Number(amount),
    purpose: purpose || "full",
    customerEmail,
    signature,
    createdAt: Date.now(),
    status: "created",
  };

  activeOrders.set(orderId, orderData);

  return {
    orderId,
    amount: orderData.amount,
    purpose: orderData.purpose,
    checkoutUrl: `/mock-gateway/checkout/${orderId}`,
    signature,
  };
}

/**
 * Retrieve active checkout order.
 */
function getOrder(orderId) {
  return activeOrders.get(orderId) || null;
}

/**
 * Process mock payment and return simulated result based on spec inputs.
 */
async function processPayment(orderId, paymentPayload) {
  const order = activeOrders.get(orderId);
  if (!order) {
    return {
      success: false,
      failureReason: "Payment session expired or invalid order ID.",
    };
  }

  const { method, cardNumber, cardExpiry, cardCvv, cardHolder, upiId, bankName, bankOutcome, otp } =
    paymentPayload;

  // Simulate network processing delay (300ms)
  await new Promise((res) => setTimeout(res, 300));

  let success = false;
  let failureReason = null;
  let cardNetwork = null;
  let cardLast4 = null;

  if (method === "card") {
    const cleanNum = (cardNumber || "").replace(/\s+/g, "");

    if (!cleanNum || !isValidLuhn(cleanNum)) {
      return { success: false, failureReason: "Invalid card number format or failed checksum." };
    }
    if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) {
      return { success: false, failureReason: "Invalid card expiry date (MM/YY)." };
    }
    if (!cardCvv || !/^\d{3,4}$/.test(cardCvv.trim())) {
      return { success: false, failureReason: "Invalid 3 or 4-digit CVV." };
    }
    if (!cardHolder || !cardHolder.trim()) {
      return { success: false, failureReason: "Cardholder name is required." };
    }

    cardNetwork = detectCardNetwork(cleanNum);
    cardLast4 = cleanNum.slice(-4);

    // Test input outcomes per spec
    if (cleanNum === "4000000000000002") {
      failureReason = "Card declined by issuing bank.";
    } else if (cleanNum === "4000000000009995") {
      failureReason = "Insufficient funds in account.";
    } else {
      // Validate OTP
      if (otp !== "123456") {
        failureReason = "Incorrect or expired OTP. Use test OTP 123456.";
      } else {
        success = true;
      }
    }
  } else if (method === "upi") {
    const cleanUpi = (upiId || "").trim().toLowerCase();
    if (!cleanUpi || !cleanUpi.includes("@")) {
      return { success: false, failureReason: "Invalid UPI ID format (e.g. name@bank)." };
    }

    if (cleanUpi === "fail@mock") {
      failureReason = "Payment rejected by user UPI application.";
    } else {
      success = true;
    }
  } else if (method === "netbanking") {
    if (!bankName) {
      return { success: false, failureReason: "Please select your bank for Netbanking." };
    }
    if (bankOutcome === "fail") {
      failureReason = "Netbanking transaction cancelled by bank authorization gateway.";
    } else {
      success = true;
    }
  } else {
    return { success: false, failureReason: "Unsupported payment method." };
  }

  const paymentId = success
    ? `pay_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`
    : null;

  const resultSignature = signPayload({
    orderId,
    paymentId,
    status: success ? "success" : "failed",
    amount: order.amount,
  });

  if (success) {
    order.status = "paid";
    order.paymentId = paymentId;
  }

  return {
    success,
    paymentId,
    orderId,
    bookingId: order.bookingId,
    amount: order.amount,
    purpose: order.purpose,
    method,
    cardNetwork,
    cardLast4,
    failureReason,
    signature: resultSignature,
  };
}

/**
 * Verify outcome signature upon callback.
 */
function verifyCallbackSignature({ orderId, paymentId, status, amount, signature }) {
  const expected = signPayload({
    orderId,
    paymentId: paymentId || null,
    status,
    amount: Number(amount),
  });
  return expected === signature;
}

module.exports = {
  createOrder,
  getOrder,
  processPayment,
  verifyCallbackSignature,
};

