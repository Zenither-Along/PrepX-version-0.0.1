# PrepX Backend Server

This directory contains the Node.js, Express, and PostgreSQL backend for the PrepX application.

## Quick Start

Follow these steps to get the backend server running locally.

### Step 1: Install Dependencies

Navigate to this directory in your terminal and install the required npm packages.

```bash
cd backend
npm install
```

### Step 2: Set Up PostgreSQL Database

You need a running PostgreSQL database for the server to connect to.

1.  **Install PostgreSQL:** If you don't have it, install it for your operating system.
2.  **Create a Database:** Create a new database for this application (e.g., `prepx_db`).
3.  **Run the Schema SQL:** Connect to your new database and run the SQL commands found in the comments of the `backend/db.js` file. This will create the `users` and `learning_paths` tables.

### Step 3: Configure Environment Variables

The server requires a `.env` file for its configuration.

1.  **Create the file:** In this `backend` directory, create a new file named `.env`.
2.  **Copy the template:** Copy the contents of `backend/.env.example` into your new `.env` file.
3.  **Fill in the values:**
    *   `DATABASE_URL`: Set this to the full connection string for the PostgreSQL database you created in Step 2.
    *   `JWT_SECRET`: Set this to a long, random, secret string. You can generate one by running this command in your terminal: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Step 4: Run the Server

Once configured, you can start the server.

```bash
# To run the server normally
npm start

# Or, to run with nodemon (restarts automatically on file changes)
npm run dev
```

The server will start on `http://localhost:3001`. If it starts successfully, you will see a message like "Server started on port 3001". You can now use the frontend application, which will be able to connect to this running server.
