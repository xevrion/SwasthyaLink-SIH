# Patient Management MVP

A minimal fullstack app for ASHA workers to manage patient records.

## Architecture

- **Frontend**: React Native (Expo) - Mobile app with basic UI
- **Backend**: Node.js with Express - REST API server
- **Database**: MongoDB - Patient data storage
- **Auth**: JWT tokens with hardcoded credentials

## Features

- ✅ Login screen (dummy authentication)
- ✅ Add Patient screen with form validation
- ✅ View Patients screen with list of all patients
- ✅ JWT-based authentication
- ✅ Clean, functional UI without animations

## Demo Credentials

- **Username**: `asha_worker`
- **Password**: `password123`

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or Atlas)
- Expo CLI: `npm install -g @expo/cli`
- For mobile testing: Expo Go app on your phone

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Start MongoDB locally (if using local DB), then start the server:
```bash
npm run dev
```

Server runs on http://localhost:3000

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Update API URL in `services/api.js` if needed (default: localhost:3000)

Start Expo:
```bash
npm start
```

- Scan QR code with Expo Go app for mobile testing
- Press 'w' for web version

## API Endpoints

- `POST /login` - Authenticate user
- `POST /patients` - Add new patient (requires auth)
- `GET /patients` - Get all patients (requires auth)
- `GET /health` - Health check

## Project Structure

```
├── backend/
│   ├── models/Patient.js     # MongoDB patient schema
│   ├── server.js            # Express server with APIs
│   ├── package.json         # Backend dependencies
│   └── .env.example         # Environment config
├── frontend/
│   ├── screens/            # React Native screens
│   ├── services/api.js     # API service layer
│   ├── App.js             # Main app with navigation
│   └── package.json       # Frontend dependencies
└── README.md
```

## Demo Flow (3-4 minutes)

1. **Login** - Show hardcoded credentials
2. **Add Patient** - Fill form with sample data
3. **View Patients** - Show patient list from MongoDB
4. **Add Another** - Demonstrate form validation
5. **Logout** - Return to login screen

## Development Notes

- No signup flow (hardcoded user)
- Minimal styling, focus on functionality
- Basic JWT auth (simplified for MVP)
- MongoDB connection handles both local and Atlas
- Form validation on frontend and backend
- Pull-to-refresh on patient list
- Automatic token storage/retrieval

<!-- ## Production Considerations

This is an MVP,
For production:

- Add proper user management
- Implement password hashing
- Add data validation
- Include error logging
- Set up proper environment configs
- Add tests
- Implement proper security headers -->
