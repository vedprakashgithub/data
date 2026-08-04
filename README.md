# EduLMS Razorpay Server (Vercel Deployment)

This is a standalone payment backend that handles Razorpay order creation, payment verification, and enrollment. It runs separately from your main app on Vercel.

## Step 1: Get Your Razorpay Keys

1. Go to https://dashboard.razorpay.com/app/keys
2. Click **Generate Test Key** (use test keys first)
3. Copy the **Key ID** and **Key Secret**

## Step 2: Get Your Supabase Credentials

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **service_role secret** (the long key — NOT the anon key)

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to https://vercel.com and log in
2. Click **Add New** → **Project**
3. **Import** this `razorpay-server` folder (push it to a GitHub repo first, or use the Vercel CLI in Option B)
4. **Framework Preset**: Vercel will auto-detect "Other" — that's fine
5. **Root Directory**: set it to `razorpay-server` if your repo includes the whole project
6. Click **Environment Variables** and add these:

   | Name | Value |
   |------|-------|
   | `RAZORPAY_KEY_ID` | `rzp_test_XXXXXXXX` (from Step 1) |
   | `RAZORPAY_KEY_SECRET` | `your_secret` (from Step 1) |
   | `SUPABASE_URL` | `https://xxxxx.supabase.co` (from Step 2) |
   | `SUPABASE_SERVICE_ROLE_KEY` | `your_service_role_key` (from Step 2) |
   | `ALLOWED_ORIGINS` | `http://localhost:5173,https://your-edulms-frontend.vercel.app` |

7. Click **Deploy**
8. After deployment, copy the URL (e.g. `https://edulms-payments.vercel.app`)

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI (one time)
npm i -g vercel

# From inside the razorpay-server folder:
cd razorpay-server
vercel

# Follow the prompts:
# - Set up and deploy: Y
# - Which scope: your account
# - Project name: edulms-payments
# - Framework preset: Other
# - Root directory: ./

# Set environment variables:
vercel env add RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ALLOWED_ORIGINS

# Paste each value when prompted, then deploy to production:
vercel --prod
```

## Step 4: Test the Server

Visit your deployed URL + `/api/health`:
```
https://your-server.vercel.app/api/health
```
You should see:
```json
{ "status": "ok", "service": "EduLMS Razorpay Server", "timestamp": "..." }
```

## Step 5: Connect Your Frontend

1. Open your main EduLMS project's `.env` file
2. Find the line:
   ```
   VITE_RAZORPAY_SERVER_URL=
   ```
3. Paste your Vercel server URL:
   ```
   VITE_RAZORPAY_SERVER_URL=https://edulms-payments.vercel.app
   ```
4. Save the file. That's it — the frontend now uses your standalone payment server.

## Step 6: Switch to Live Mode (When Ready)

1. In Razorpay dashboard, complete your KYC / account activation
2. Generate **Live Keys** at https://dashboard.razorpay.com/app/keys
3. In Vercel, update the environment variables:
   - `RAZORPAY_KEY_ID` → your live key ID (`rzp_live_XXXX`)
   - `RAZORPAY_KEY_SECRET` → your live key secret
4. Redeploy: `vercel --prod`

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/create-order` | POST | Create a Razorpay order |
| `/api/verify-payment` | POST | Verify payment signature & enroll student |
| `/api/free-enrollment` | POST | Enroll student in a free course |

## Notes

- The server reads Razorpay keys from environment variables first, then falls back to the `settings` table in Supabase. You can use either method.
- The `ALLOWED_ORIGINS` variable controls CORS — set it to your frontend URL(s), comma-separated. Use `*` to allow all origins (not recommended for production).
- The server uses your Supabase service role key to verify user tokens and write payment/enrollment records. Never expose this key in the frontend.
