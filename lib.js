require("dotenv").config();

const crypto = require("crypto");
const Razorpay = require("razorpay");
const { createClient } = require("@supabase/supabase-js");

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Razorpay Client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CORS Headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// Verify User from Supabase JWT
async function verifyUser(req) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) return null;

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) return null;

    return user;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Load Settings Table
async function loadSettings() {
  const { data } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  return data || {};
}

// Razorpay Keys
function getRazorpayKeys(settings = {}) {
  return {
    keyId:
      process.env.RAZORPAY_KEY_ID ||
      settings.razorpay_key_id,

    keySecret:
      process.env.RAZORPAY_KEY_SECRET ||
      settings.razorpay_key_secret,
  };
}

// Razorpay Signature Verification
function verifySignature(orderId, paymentId, signature) {
  const generated = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET
    )
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generated === signature;
}

module.exports = {
  supabase,
  razorpay,
  crypto,
  corsHeaders,
  verifyUser,
  loadSettings,
  getRazorpayKeys,
  verifySignature,
};