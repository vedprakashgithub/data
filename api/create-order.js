const express = require("express");
const Razorpay = require("razorpay");
const { supabase } = require("../lib");

const router = express.Router();

router.post("/create-order", async (req, res) => {
  try {
    const { amount, courseId, batchId, studentId } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
      });
    }

    // Load system settings (optional)
    const { data: settings } = await supabase
      .from("system_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const keyId =
      process.env.RAZORPAY_KEY_ID || settings?.razorpay_key_id;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || settings?.razorpay_key_secret;

    if (!keyId || !keySecret) {
      return res.status(500).json({
        error: "Razorpay credentials not configured",
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const currency = settings?.currency || "INR";

    const taxRate = Number(settings?.tax_rate || 0);

    const taxAmount = Math.round(amount * taxRate) / 100;

    const totalAmount = Number(amount) + taxAmount;

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: {
        student_id: studentId || "",
        course_id: courseId || "",
        batch_id: batchId || "",
      },
    });

    await supabase.from("payments").insert({
      student_id: studentId,
      course_id: courseId,
      batch_id: batchId,
      amount: totalAmount,
      currency,
      payment_status: "pending",
      payment_method: "razorpay",
      razorpay_order_id: order.id,
    });

    res.json({
      orderId: order.id,
      razorpayKeyId: keyId,
      amount: order.amount,
      currency: order.currency,
      taxAmount,
      totalAmount,
    });
  } catch (err) {
    console.error("Create Order Error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;