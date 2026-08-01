# SkyVault (Telegram Storage App)

SkyVault is a cloud storage application that leverages the Telegram MTProto API as a backend for infinite file storage. This project features a full-stack architecture with a React frontend and Node.js/Express backend.

## Key Skills & Technologies Used

### Frontend (Client-side)
* **React.js**: Core library for building the user interface.
* **Vite**: Next-generation frontend tooling for fast development and building.
* **React Router**: For handling client-side navigation.
* **Axios**: Promised-based HTTP client for API requests.
* **React Doc Viewer**: For rendering document previews directly in the browser.
* **Lucide React**: Vector icons for modern UI design.

### Backend (Server-side)
* **Node.js**: JavaScript runtime environment.
* **Express.js**: Fast, unopinionated web framework for building the RESTful API.
* **MongoDB & Mongoose**: NoSQL database and Object Data Modeling (ODM) for storing user metadata, file records, and application state.
* **Telegram MTProto API (`telegram` package)**: Utilizing Telegram's servers for secure and virtually unlimited file storage.
* **JWT (JSON Web Tokens) & Bcrypt**: Secure user authentication, authorization, and password hashing.
* **Nodemailer**: Email integration for sending OTPs (One-Time Passwords).
* **Multer**: Middleware for handling `multipart/form-data`, primarily used for uploading files.
* **OfficeParser**: Extracting text content from Office documents (Word, PowerPoint, Excel) for file previews.

## Application Architecture
- The application offloads heavy file storage to Telegram's robust infrastructure while maintaining standard user accounts, authentication, and file metadata locally in MongoDB.
- OTP verification is integrated for enhanced user account security (using Nodemailer).
- Features document text extraction and rendering to allow users to preview files before full downloads.

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB instance (local or Atlas)
- Telegram API Credentials (`API_ID`, `API_HASH` from my.telegram.org)
- SMTP credentials for emails

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file in the `backend` directory containing:
   ```env
   PORT=
   MONGODB_URI=
   JWT_SECRET=
   TELEGRAM_API_ID=
   TELEGRAM_API_HASH=
   SMTP_HOST=
   SMTP_PORT=
   SMTP_USER=
   SMTP_PASS=
   ```

3. **Running the Application:**
   Start the backend server:
   ```bash
   cd backend
   npm run dev  # or node index.js
   ```

   Start the frontend React application:
   ```bash
   cd frontend
   npm run dev
   ```
