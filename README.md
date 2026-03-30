# PAI ERP System

A comprehensive Employee Resource Planning (ERP) system built with MERN stack.

## Project Structure

```
PAI-ERP/
├── frontend/          # React frontend application
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── modals/
│       ├── pages/
│       ├── sections/
│       ├── App.js
│       └── index.js
│
└── backend/           # Node.js/Express backend API
    ├── config/
    ├── models/
    ├── routes/
    ├── controllers/
    ├── middleware/
    └── server.js
```

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Bootstrap 5
- Chart.js & Recharts
- Axios

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT Authentication

## Getting Started

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

The app will run on `http://localhost:3000`

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Start the server:
```bash
npm run dev
```

The API will run on `http://localhost:5000`

## Features

- 📊 Admin Dashboard
- 👥 Employee Management
- 📅 Attendance Tracking
- 🏖️ Leave Management
- 📝 Recruitment Module
- 📈 Reports & Analytics

## Current Status

✅ Project structure created
✅ Basic UI components implemented
✅ Routing configured
⏳ Backend API (Coming soon)
⏳ Database integration (Coming soon)
⏳ Authentication (Coming soon)

## License

Private - PAI ERP System

