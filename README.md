# MovieTime – Cinema Ticket Booking

A full-stack MERN web app where users browse movies and theatres, choose seats on a live seat map and book tickets. When one user selects a seat, it is locked for everyone else **instantly** using Socket.IO, so two people can never book the same seat.

Built with **MongoDB, Express, React, Node.js and Socket.IO**.

---

## Screenshots

> Create a `screenshots/` folder in the project root, save your images there with these names and they will show up below.

| Home – now showing | Theatres – near me |
| :---: | :---: |
| ![Home](screenshots/home.png) | ![Theatres](screenshots/theatres.png) |

| Show list for a movie | Live seat map |
| :---: | :---: |
| ![Shows](screenshots/shows.png) | ![Seat map](screenshots/seatmap.png) |

| Two users, live seat locking | Booking with ticket code |
| :---: | :---: |
| ![Live locking](screenshots/live-locking.png) | ![My bookings](screenshots/my-bookings.png) |

| Admin – manage movies, theatres, shows | Collection reports |
| :---: | :---: |
| ![Admin](screenshots/admin.png) | ![Reports](screenshots/reports.png) |

| Login | Postman tests |
| :---: | :---: |
| ![Login](screenshots/login.png) | ![Postman](screenshots/postman.png) |

---

## Features

**For users**
- Register and log in securely (JWT access and refresh tokens).
- Browse movies, search by title and see upcoming shows.
- **Theatres page** with a **Near me** button that sorts cinemas by distance from your location, plus search by name or city.
- Pick seats on a seat map and see other users' selections in real time.
- Book tickets and get a **unique ticket code** (for example `MT-9F3A21BC`).
- View booking history and cancel a booking before the show starts.

**For theatre admins**
- Add and delete movies.
- Add their own theatres (with optional map position) and screens (rows and seats per row).
- Schedule shows with movie, screen, time and price.
- See collection reports for their own theatres only.

**For the super admin**
- Everything a theatre admin can do, for all theatres.
- Create theatre admin accounts.

**Live seat locking**
- Clicking a seat holds it for 5 minutes and turns it red for other users.
- Leaving the page, closing the tab or letting the hold expire releases the seat.
- The server re-checks the hold at booking time and uses an atomic database update, which prevents double booking even when two people confirm at the same moment.

---

## User roles

| Role | What they can do |
| --- | --- |
| `user` | Browse, select seats, book, view history, cancel own bookings |
| `theatreAdmin` | CRUD for movies, own theatres, screens and shows; collection reports for own theatres |
| `superAdmin` | All admin actions for every theatre; creates theatre admins |

Public registration always creates a normal `user`. Admins are created by the seed script or by the super admin.

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| Backend | Node.js, Express, Mongoose, dotenv, bcrypt, jsonwebtoken, Socket.IO |
| Database | MongoDB |
| Frontend | React 18, React Router, Fetch API, Context API, socket.io-client, Vite |
| Other | Node `crypto` module for ticket codes, Postman for API testing |

---

## Project structure

```
movietime/
├── server/
│   ├── config/          db.js, env.js
│   ├── models/          User, Movie, Theatre, Screen, Show, Booking
│   ├── controllers/     auth, movie, theatre, screen, show, booking, report
│   ├── routes/          one route file per controller
│   ├── middleware/      auth.js (JWT), role.js (RBAC), error.js (central handler)
│   ├── sockets/         seatSocket.js, seatLocks.js (live seat locking)
│   ├── utils/           token.js, ticketCode.js, seats.js, AppError.js, asyncHandler.js
│   ├── seed.js          demo data and demo accounts
│   └── server.js
├── client/
│   └── src/
│       ├── context/     AuthContext.jsx, SocketContext.jsx
│       ├── components/  Navbar.jsx, ProtectedRoute.jsx
│       ├── pages/       Movies, MovieShows, Theatres, SeatMap, MyBookings,
│       │                Login, Register, Admin, Reports
│       ├── api.js       fetch wrapper with automatic token refresh
│       └── App.jsx
├── MovieTime.postman_collection.json
└── README.md
```

---

## Getting started

### Prerequisites
- Node.js 18 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

### 1. Backend

```bash
cd server
cp .env.example .env     # on Windows: copy .env.example .env
npm install
npm run seed             # creates demo accounts, a theatre, 2 movies and 2 shows
npm run dev              # API on http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev              # app on http://localhost:5173
```

The Vite dev server proxies `/api` and `/socket.io` to port 5000, so no CORS setup is needed.

### Environment variables (`server/.env`)

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | API port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/movietime` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | long random string |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | a different long random string |
| `ACCESS_EXPIRES` | Access token lifetime | `30m` |
| `REFRESH_EXPIRES` | Refresh token lifetime | `7d` |
| `CLIENT_URL` | Allowed origin for Socket.IO | `http://localhost:5173` |
| `SEAT_LOCK_MINUTES` | How long a selected seat is held | `5` |

The `.env` file is listed in `.gitignore` and must never be committed.

### Demo accounts (after `npm run seed`)

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `super@movietime.com` | `Super@123` |
| Theatre admin | `admin@movietime.com` | `Admin@123` |
| User | `user@movietime.com` | `User@123` |

---

## How to use the app

1. **Log in** as the theatre admin and open **Manage**.
2. Add a **movie**, a **theatre** (use *Use my location* to save its position), a **screen** for that theatre, then schedule a **show** with a future time.
3. Log in as a **user**, open a movie (or the **Theatres** page), choose a show and click seats.
4. Click **Confirm booking** to get your ticket code on the **My bookings** page.
5. Log back in as the admin and open **Collections** to see the money and tickets per movie and per show.

**To see live seat locking:** open the same show in two browsers (or one normal and one private window) logged in as two different users. A seat picked in one window turns red in the other straight away.

---

## Database design

| Collection | Main fields | Relationships |
| --- | --- | --- |
| `User` | name, email (unique), password (hashed), role, refreshToken (hashed) | – |
| `Movie` | title, description, duration, language, genre, poster | `createdBy` → User |
| `Theatre` | name, city, latitude, longitude | `admin` → User |
| `Screen` | name, rows, seatsPerRow | `theatre` → Theatre |
| `Show` | startTime, price, bookedSeats | `movie` → Movie, `screen` → Screen, `theatre` → Theatre |
| `Booking` | seats, totalAmount, ticketCode (unique), status | `user` → User, `show` → Show |

**Indexes:** `User.email` (unique), `Show {movie, startTime}`, `Booking.ticketCode` (unique), `Booking {user, createdAt}`, `Booking {show, status}`, `Screen {theatre, name}` (unique).

---

## REST API

Base URL: `http://localhost:5000/api`. Routes marked 🔒 need a valid access token, and routes marked 🛡️ also need an admin role.

| Area | Method and path | Access |
| --- | --- | --- |
| Auth | `POST /auth/register` | public |
| | `POST /auth/login` | public |
| | `POST /auth/refresh` | public (needs refresh token) |
| | `POST /auth/logout` | 🔒 |
| | `GET /auth/me` | 🔒 |
| | `POST /auth/create-admin` | 🔒 super admin |
| Movies | `GET /movies`, `GET /movies/:id` | public |
| | `POST /movies`, `PUT /movies/:id`, `DELETE /movies/:id` | 🛡️ |
| Theatres | `GET /theatres` | public |
| | `GET /theatres/mine` | 🛡️ |
| | `POST /theatres`, `PUT /theatres/:id`, `DELETE /theatres/:id` | 🛡️ own theatres |
| Screens | `GET /screens` | public |
| | `GET /screens/mine`, `POST /screens`, `DELETE /screens/:id` | 🛡️ own theatres |
| Shows | `GET /shows?movie=&theatre=&upcoming=true`, `GET /shows/:id` | public |
| | `GET /shows/manage`, `POST /shows`, `PUT /shows/:id`, `DELETE /shows/:id` | 🛡️ own theatres |
| Bookings | `POST /bookings` | 🔒 |
| | `GET /bookings/my` | 🔒 |
| | `PATCH /bookings/:id/cancel` | 🔒 owner or super admin |
| Reports | `GET /reports/movies`, `GET /reports/shows` | 🛡️ (aggregation) |

Errors are returned by one central handler as `{ "success": false, "message": "..." }` with the right status code (400, 401, 403, 404, 409, 500).

### Socket.IO events

| Direction | Event | Purpose |
| --- | --- | --- |
| client → server | `joinShow`, `leaveShow` | Start or stop watching the seats of a show |
| client → server | `lockSeat`, `unlockSeat` | Select or deselect a seat |
| server → client | `locks` | Current list of held seats for the show |
| server → client | `seatsBooked` | Seats that were just booked |
| server → client | `seatsReleased` | Seats freed by a cancellation |

Sockets are authenticated with the same JWT access token.

---

## Security

- Passwords are hashed with **bcrypt** and never returned by the API.
- **JWT access tokens** are short-lived. **Refresh tokens** are rotated on every use and only a hash is stored in the database.
- Role-based access control is enforced on the server for every admin route.
- A theatre admin can only change theatres, screens and shows that they own.
- Booking is validated on the server: the show must be in the future, seats must exist on the screen, each seat must be held by the booking user, and the database update is atomic.

---

## API testing with Postman

1. Import `MovieTime.postman_collection.json` into Postman.
2. Run the three **Login** requests first. They save `accessToken` and `refreshToken` as collection variables.
3. Run the list requests (movies, theatres, screens, shows) to fill the id variables.
4. Create your first booking through the React app, because booking needs a seat lock made over Socket.IO. After that, **My bookings**, **Cancel booking** and the **Reports** requests work in Postman.
5. The **RBAC checks** folder shows the 401 and 403 responses.

---

## Project requirements checklist

- [x] MVC folder structure (models, controllers, routes, middleware, config)
- [x] Environment variables in `.env`, never committed
- [x] Registration and login with bcrypt hashing and JWT access and refresh tokens
- [x] Protected route (`GET /bookings/my`) and role-based routes (`POST /movies`, `/reports/*`)
- [x] Mongoose schemas with validation and relationships between collections
- [x] Aggregation pipelines (`reportController.js`) and indexes
- [x] Centralised error-handling middleware with proper HTTP status codes
- [x] REST API tested with Postman (collection included)
- [x] React frontend with routing, controlled forms, Context API and protected pages
- [x] Live seat locking with Socket.IO and unique ticket codes with `crypto`

---

## Possible improvements

- Online payment before the booking is confirmed
- Email or SMS ticket delivery with a QR code
- Store seat locks in Redis so the server can run on several instances
- Map view of nearby theatres
- Reviews and ratings for movies

---

## Author

Built by **Ankit Kumar Pandey** as a full-stack project.

GitHub: `https://github.com/<your-username>`
