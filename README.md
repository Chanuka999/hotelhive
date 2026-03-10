# 🏨 HotelHive - Hotel Booking System

A full-stack MERN (MongoDB, Express.js, React, Node.js) hotel booking system that allows users to search hotels, check room availability, and book rooms online with secure authentication and a responsive user interface.

## 📋 Features

### User Features

- 🔐 User authentication (Register/Login with JWT)
- 🔍 Search hotels by location, dates, and guests
- 🏨 Browse hotels with filters (price, rating, amenities)
- 📝 View detailed hotel information with image gallery
- 📅 Check room availability
- 💳 Secure online booking with Stripe payment
- 📧 Email confirmations
- 📊 User dashboard to manage bookings
- ⭐ Rate and review hotels

### Hotel Owner Features

- 🏢 Add and manage hotels
- 🖼️ Upload hotel and room images
- 💰 Set pricing and availability
- 📈 View booking analytics
- 📋 Manage incoming bookings

### Admin Features

- 👥 User management
- ✅ Hotel verification
- 📊 Platform analytics
- 💼 Booking oversight

## 🛠️ Technologies Used

### Backend

- **Node.js** & **Express.js** - Server framework
- **MongoDB** & **Mongoose** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** & **Cloudinary** - Image uploads
- **Stripe** - Payment processing
- **Nodemailer** - Email notifications
- **Helmet** - Security headers
- **Express Rate Limit** - API rate limiting

### Frontend

- **React 18** - UI library
- **Redux Toolkit** - State management
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **React DatePicker** - Date selection
- **Formik** & **Yup** - Form handling & validation

## 📁 Project Structure

```
hotelhive/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth & error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers (to be created)
│   ├── utils/           # Utility functions (to be created)
│   ├── .env.example     # Environment variables template
│   ├── package.json     # Backend dependencies
│   └── server.js        # Entry point
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── redux/       # Redux store & slices
│   │   ├── services/    # API services (to be created)
│   │   └── utils/       # Utility functions (to be created)
│   ├── package.json     # Frontend dependencies
│   └── tailwind.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd hotelhive
```

2. **Install Backend Dependencies**

```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**

```bash
cd ../frontend
npm install
```

4. **Setup Environment Variables**

Create a `.env` file in the `backend` folder:

```bash
cd backend
copy .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:3000
```

5. **Start Development Servers**

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm start
```

The backend will run on `http://localhost:5000` and frontend on `http://localhost:3000`

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Forgot password
- `PUT /api/auth/reset-password/:token` - Reset password

### Hotels

- `GET /api/hotels` - Get all hotels
- `GET /api/hotels/:id` - Get hotel by ID
- `POST /api/hotels` - Create hotel (Hotel Owner)
- `PUT /api/hotels/:id` - Update hotel
- `DELETE /api/hotels/:id` - Delete hotel
- `GET /api/hotels/search` - Search hotels

### Bookings

- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Reviews

- `GET /api/reviews/hotel/:hotelId` - Get hotel reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Payments

- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/webhook` - Stripe webhook

## 🗺️ Development Roadmap

- [x] **Phase 1**: Project structure and setup
- [ ] **Phase 2**: Complete authentication system
- [ ] **Phase 3**: Hotel management features
- [ ] **Phase 4**: Booking system implementation
- [ ] **Phase 5**: Payment integration (Stripe)
- [ ] **Phase 6**: Reviews and ratings
- [ ] **Phase 7**: Admin & Owner dashboards
- [ ] **Phase 8**: Testing and deployment

## 📝 Database Models

### User

- Name, Email, Password
- Role (user, admin)
- Avatar, Phone
- Verification status

### Hotel

- Name, Description
- Address & Location (geospatial)
- Images, Amenities
- Star Rating, Average Rating
- Owner reference
- Rooms array

### Room

- Hotel reference
- Room Type (Single, Double, Suite, etc.)
- Price, Capacity
- Size, Bed Type
- Amenities, Images
- Total & Available rooms

### Booking

- User, Hotel, Room references
- Check-in/Check-out dates
- Guests, Number of rooms
- Total Price, Status
- Payment info
- Special requests

### Review

- Hotel & User references
- Rating (1-5)
- Comment
- Linked to completed booking

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- Helmet for security headers
- Rate limiting on API endpoints
- MongoDB injection prevention
- XSS protection
- CORS configuration

## 🎨 UI Pages

- Home page with hero section
- Hotels listing with search & filters
- Hotel details with image gallery
- Booking flow with date picker
- User dashboard (bookings, profile)
- Authentication pages (Login/Register)
- 404 Not Found page

## 📦 Deployment

### Backend Deployment (Render/Heroku)

1. Create account on Render or Heroku
2. Connect your repository
3. Set environment variables
4. Deploy backend

### Frontend Deployment (Vercel/Netlify)

1. Create account on Vercel or Netlify
2. Connect your repository
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Deploy frontend

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name

## 📧 Contact

For any queries, reach out at: info@hotelhive.com

---

**Happy Coding! 🚀**
