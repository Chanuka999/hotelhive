# HotelHive - Project Structure

## Backend Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── errorHandler.js      # Error handling middleware
├── models/
│   ├── User.js              # User schema
│   ├── Hotel.js             # Hotel schema
│   ├── Room.js              # Room schema
│   ├── Booking.js           # Booking schema
│   └── Review.js            # Review schema
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── userRoutes.js        # User routes
│   ├── hotelRoutes.js       # Hotel routes
│   ├── bookingRoutes.js     # Booking routes
│   ├── reviewRoutes.js      # Review routes
│   └── paymentRoutes.js     # Payment routes
├── controllers/             # Route controllers (to be created)
├── utils/                   # Utility functions (to be created)
├── .env.example             # Environment variables template
├── package.json             # Backend dependencies
└── server.js                # Entry point
```

## Frontend Structure

```
frontend/
├── public/
│   └── index.html           # HTML template
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Navbar.js    # Navigation bar
│   │       └── Footer.js    # Footer
│   ├── pages/
│   │   ├── Home.js          # Home page
│   │   ├── Login.js         # Login page
│   │   ├── Register.js      # Register page
│   │   ├── Hotels.js        # Hotels listing
│   │   ├── HotelDetails.js  # Hotel details
│   │   ├── BookingPage.js   # Booking page
│   │   ├── UserDashboard.js # User dashboard
│   │   └── NotFound.js      # 404 page
│   ├── redux/
│   │   ├── slices/
│   │   │   ├── authSlice.js     # Auth state
│   │   │   ├── hotelSlice.js    # Hotel state
│   │   │   └── bookingSlice.js  # Booking state
│   │   └── store.js         # Redux store
│   ├── services/            # API services (to be created)
│   ├── utils/               # Utility functions (to be created)
│   ├── App.js               # Main App component
│   ├── index.js             # Entry point
│   └── index.css            # Global styles
├── package.json             # Frontend dependencies
├── tailwind.config.js       # Tailwind configuration
└── postcss.config.js        # PostCSS configuration
```

## Next Steps

### 1. Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Setup Environment Variables

```bash
# Copy .env.example to .env in backend folder
cd backend
cp .env.example .env
# Edit .env with your actual values
```

### 3. Start Development Servers

```bash
# Terminal 1 - Start backend (from backend folder)
npm run dev

# Terminal 2 - Start frontend (from frontend folder)
npm start
```

### 4. MongoDB Setup

- Install MongoDB locally OR
- Create MongoDB Atlas account and get connection string
- Add connection string to .env file

## Development Roadmap

### Phase 1: Setup ✅

- [x] Project structure created
- [x] Basic models defined
- [x] Authentication middleware
- [x] Frontend routing setup
- [x] Redux store configuration

### Phase 2: Authentication (Next)

- [ ] Implement auth controllers
- [ ] Complete auth routes
- [ ] Test login/register functionality
- [ ] Protected routes

### Phase 3: Hotel Management

- [x] Hotel CRUD controllers
- [x] Image upload with Cloudinary
- [x] Search and filter functionality
- [x] Hotel listing page UI

### Phase 4: Booking System

- [ ] Booking controllers
- [ ] Availability checking
- [ ] Booking flow UI
- [ ] Date picker integration

### Phase 5: Payment Integration

- [ ] Stripe integration
- [ ] Payment processing
- [ ] Email notifications
- [ ] Invoice generation

### Phase 6: Reviews & Ratings

- [ ] Review system
- [ ] Rating calculation
- [ ] Review UI components

### Phase 7: Admin & Owner Dashboards

- [ ] Admin panel
- [ ] Hotel owner dashboard
- [ ] Analytics
- [ ] Reporting

### Phase 8: Testing & Deployment

- [ ] Unit tests
- [ ] Integration tests
- [ ] Production build
- [ ] Deploy to cloud

## Technologies Used

### Backend

- Node.js & Express
- MongoDB & Mongoose
- JWT Authentication
- Bcrypt for password hashing
- Multer & Cloudinary for file uploads
- Stripe for payments
- Nodemailer for emails

### Frontend

- React 18
- Redux Toolkit
- React Router v6
- Tailwind CSS
- Axios
- React Toastify
- React DatePicker
- Formik & Yup

## API Endpoints (Planned)

### Authentication

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/forgot-password
- PUT /api/auth/reset-password/:token

### Users

- GET /api/users (Admin)
- GET /api/users/:id
- PUT /api/users/:id
- DELETE /api/users/:id

### Hotels

- GET /api/hotels
- GET /api/hotels/:id
- POST /api/hotels (Hotel Owner)
- PUT /api/hotels/:id
- DELETE /api/hotels/:id
- GET /api/hotels/search

### Bookings

- GET /api/bookings
- GET /api/bookings/:id
- POST /api/bookings
- PUT /api/bookings/:id
- DELETE /api/bookings/:id (Cancel)

### Reviews

- GET /api/reviews/hotel/:hotelId
- POST /api/reviews
- PUT /api/reviews/:id
- DELETE /api/reviews/:id

### Payments

- POST /api/payments/create-payment-intent
- POST /api/payments/webhook
