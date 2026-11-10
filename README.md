# 🏏 Cricket Tournament Registration System

A premium, modern cricket player registration system built with **Next.js 14 App Router**, **MongoDB Atlas**, **Cloudinary**, and **Tailwind CSS**.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.xxxxx.mongodb.net/cricket_tournament?retryWrites=true&w=majority

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
cricket-registration/
├── app/
│   ├── api/
│   │   ├── register/
│   │   │   └── route.js          # POST /api/register
│   │   └── players/
│   │       └── route.js          # GET /api/players
│   ├── globals.css               # Global styles + fonts
│   ├── layout.js                 # Root layout
│   └── page.js                   # Main registration page
│
├── components/
│   ├── TournamentHeader.jsx      # Header (Server Component)
│   ├── RegistrationForm.jsx      # Main form (Client Component)
│   ├── InputField.jsx            # Reusable input
│   ├── ImageUpload.jsx           # Drag & drop image upload
│   ├── PlayingStyleSelector.jsx  # Multi-select (max 2)
│   ├── RoleSelector.jsx          # Role picker
│   ├── PaymentQR.jsx             # QR code + payment info
│   └── SuccessModal.jsx          # Post-registration modal
│
├── lib/
│   ├── mongodb.js                # MongoDB connection (cached)
│   └── cloudinary.js             # Cloudinary config + helpers
│
├── models/
│   └── Player.js                 # Mongoose Player schema
│
├── utils/
│   └── apiHelpers.js             # API response + validation utils
│
├── .env.example
├── next.config.mjs
├── tailwind.config.js
└── package.json
```

---

## 🔌 API Reference

### POST `/api/register`

Register a new player.

**Request Body:**
```json
{
  "name": "Virat Singh",
  "mobile": "9876543210",
  "playerPhotoBase64": "data:image/jpeg;base64,...",
  "playingStyle": ["Batting", "Fielding Specialist"],
  "role": "Batsman",
  "paymentScreenshotBase64": "data:image/jpeg;base64,...",
  "transactionId": "TXN123456789"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful! Your application is under review.",
  "data": {
    "id": "...",
    "name": "Virat Singh",
    "playerPhoto": "https://res.cloudinary.com/...",
    "playingStyle": ["Batting", "Fielding Specialist"],
    "role": "Batsman",
    "transactionId": "TXN123456789",
    "status": "pending",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error Response (409 - Duplicate Transaction):**
```json
{
  "success": false,
  "message": "Transaction ID \"TXN123456789\" already exists."
}
```

---

### GET `/api/players`

Fetch all registered players.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page |
| `status` | string | - | Filter by status (pending/approved/rejected) |
| `role` | string | - | Filter by role |

**Success Response:**
```json
{
  "success": true,
  "data": {
    "players": [...],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

---

## 🗄️ MongoDB Schema

```js
{
  name: String,          // required
  mobile: String,        // required, Indian format
  playerPhoto: {
    url: String,         // Cloudinary secure URL
    public_id: String    // Cloudinary public ID
  },
  playingStyle: [String], // 1-2 from enum
  role: String,          // Batsman | Bowler | All Rounder
  paymentScreenshot: {
    url: String,
    public_id: String
  },
  transactionId: String, // unique, uppercase
  status: String,        // pending | approved | rejected
  createdAt: Date,
  updatedAt: Date
}
```

---

## ☁️ Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → copy Cloud Name, API Key, API Secret
3. Player photos are stored in: `cricket_tournament/player_photos/`
4. Payment screenshots in: `cricket_tournament/payment_screenshots/`

---

## 🎨 Features

- ✅ Premium dark cricket-themed UI
- ✅ Drag & drop image uploads with preview
- ✅ Multi-select playing style (max 2)
- ✅ Visual role selector
- ✅ Payment QR code display
- ✅ Real-time frontend validation
- ✅ Duplicate transaction ID prevention
- ✅ Cloudinary image upload & storage
- ✅ Success modal with player details
- ✅ Toast notifications
- ✅ Loading states & animations
- ✅ Fully responsive (mobile-first)
- ✅ Server Components where possible
- ✅ MongoDB with Mongoose validation
- ✅ Paginated player list API

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14 | Framework (App Router) |
| Tailwind CSS | Styling |
| MongoDB Atlas | Database |
| Mongoose | ODM |
| Cloudinary | Image storage |
| Axios | HTTP client |
| react-hot-toast | Notifications |

---

## 📝 Customization

### Change Registration Fee / UPI
Edit `components/PaymentQR.jsx` — update the amount and UPI ID.

### Add Tournament Branding
Edit `components/TournamentHeader.jsx` — update title, subtitle, stats.

### Change QR Code
Replace the SVG in `PaymentQR.jsx` with an `<img>` tag pointing to your actual payment QR image.

### Email Notifications
Add nodemailer or Resend SDK in the POST API route after successful registration.
