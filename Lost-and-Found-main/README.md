# Lost and Found Management System for Government Public Transport

A comprehensive web application designed to help manage lost and found items in government public transport systems. This system provides both passenger and administrative interfaces for reporting, tracking, and managing lost items.

## Features

- **Item Reporting**: Passengers can report lost items with detailed descriptions
- **Admin Dashboard**: Administrative interface for managing lost and found items
- **Search & Filter**: Advanced search capabilities for finding specific items
- **Notifications**: WhatsApp and email alerts for item matches
- **PDF Generation**: Generate reports and notices
- **Employee Management**: Manage transport system employees
- **Route Management**: Track items by specific transport routes
- **Vehicle Assignment**: Assign employees to specific vehicles and routes

## Tech Stack

### Frontend

- React.js with Vite
- Tailwind CSS for styling
- Responsive design

### Backend

- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for email notifications
- Twilio for WhatsApp alerts

## Installation

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (create a `.env` file):

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

4. Start the backend server:

```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Usage

1. **For Passengers**: Access the main interface to report lost items or search for found items
2. **For Administrators**: Use the admin login to access the dashboard for managing items, employees, and system settings
3. **For Transport Staff**: Report found items and manage assignments

## Project Structure

```
├── backend/                 # Backend API server
│   ├── controllers/        # Route controllers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   └── config/            # Database configuration
├── frontend/              # Frontend React application
│   └── src/
│       ├── components/    # React components
│       ├── pages/        # Page components
│       └── utils/        # Utility functions
└── public/               # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the ISC License.
