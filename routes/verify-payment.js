const express = require("express");
const crypto = require("crypto");
const { supabase } = require("../lib");

const router = express.Router();

router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      courseId,
      batchId,
      studentId,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        error: "Missing payment verification data",
      });
    }

    // Verify Razorpay Signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      await supabase
        .from("payments")
        .update({
          payment_status: "failed",
        })
        .eq("razorpay_order_id", razorpayOrderId);

      return res.status(400).json({
        verified: false,
        error: "Payment signature verification failed",
      });
    }

    // Get Payment Record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, amount")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();

    if (paymentError) throw paymentError;

    if (!payment) {
      return res.status(404).json({
        error: "Payment record not found",
      });
    }

    // Update Payment
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        payment_status: "success",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        transaction_id: razorpayPaymentId,
      })
      .eq("id", payment.id);

    if (updateError) throw updateError;

    // Create Enrollment
    if (batchId) {
      const { data: existing } = await supabase
        .from("batch_enrollments")
        .select("id")
        .eq("batch_id", batchId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from("batch_enrollments")
          .insert({
            batch_id: batchId,
            student_id: studentId,
            course_id: courseId,
            status: "active",
          });

        if (error) throw error;
      }
    } else {
      const { data: existing } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from("course_enrollments")
          .insert({
            course_id: courseId,
            student_id: studentId,
            status: "active",
            progress_percent: 0,
            enrolled_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    }

    // Create Invoice
   // Check if invoice already exists
const { data: existingInvoice, error: checkInvoiceError } = await supabase
  .from("invoices")
  .select("id")
  .eq("payment_id", payment.id)
  .maybeSingle();

if (checkInvoiceError) throw checkInvoiceError;

if (!existingInvoice) {
  const { error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      payment_id: payment.id,
      invoice_number: `INV-${Date.now()}`,
      student_id: studentId,
      amount: payment.amount,
      issued_at: new Date().toISOString(),
      razorpay_invoice_id: razorpayPaymentId,
      batch_id: batchId || null,
    });

  if (invoiceError) throw invoiceError;
}

    // Update Fee Installments
    await supabase
      .from("fee_installments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_id: payment.id,
      })
      .eq("payment_id", payment.id);

    return res.status(200).json({
      verified: true,
      success: true,
      message: "Payment verified and enrollment created",
    });
  } catch (err) {
    console.error("Verify Payment Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;