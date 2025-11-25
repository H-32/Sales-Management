# Sales Management System

A simple Arabic-friendly **Sales Management System** built with Node.js, Express, SQL Server, and a glassmorphism-style dashboard UI.

The system is designed for **small and medium businesses** to manage products, customers, orders, and sales reports in a clean, focused web interface.

---

## ✨ Features

- **Authentication & Sessions**
  - Admin login with session-based authentication (using `express-session`).
  - Protected APIs – only logged-in users can access the dashboard and data.

- **Products Management**
  - Add, edit, delete products.
  - Store product name and price.
  - View all products in a modern data table.

- **Customers Management**
  - Add, edit, delete customers.
  - Store name, phone, and email.
  - View customers in a sorted table.

- **Orders Management**
  - Create orders linked to a customer and a product.
  - Set quantity, unit price, and order date.
  - Calculate line totals automatically.
  - Delete orders safely (removes order items as well).

- **Dashboard & Statistics**
  - Total products, customers, and orders.
  - Total sales (all time).
  - Today’s sales.
  - Animated stat cards using **GSAP**.

- **Sales Reports**
  - Filter by date range and/or by customer.
  - View detailed rows (order date, customer, product, quantity, unit price, line total).
  - Summary panel:
    - Total sales
    - Number of orders
    - Total quantity
  - Export to **CSV** and open in Excel (Arabic-friendly, UTF-8 with BOM).

- **Landing Page / Portfolio**
  - Hero section describing the system.
  - Sections: About, Features, How it works, Call to Action.
  - Smooth scrolling, hover animations, and card animations using GSAP.
  - Footer with social links (Facebook, Instagram, GitHub, Email).

---

## 🛠 Tech Stack

- **Backend**
  - Node.js
  - Express
  - `mssql` (SQL Server driver)
  - `express-session`
  - `dotenv`
  - CORS

- **Database**
  - Microsoft SQL Server (tested with `SQLEXPRESS` instance)

- **Frontend**
  - HTML5
  - CSS3 (custom design, RTL-ready)
  - Vanilla JavaScript
  - [GSAP](https://greensock.com/gsap/) for animations
  - Font Awesome (social icons)

---

## 📁 Project Structure

```text
project-root/
├─ server.js              # Express server + APIs + sessions
├─ package.json
├─ .env.example           # Example environment variables
├─ /public
│  ├─ index.html          # Landing page (portfolio)
│  ├─ login.html          # Login page
│  ├─ dashboard.html      # Main admin dashboard
│  ├─ /css
│  │   └─ style.css       # Shared styles (landing + dashboard)
│  └─ /js
│      ├─ landing.js      # Animations and UX for landing page
│      └─ dashboard.js    # Dashboard logic (CRUD, stats, reports, CSV)
└─ /sql (optional)
   └─ schema.sql          # Database tables and sample data (if you choose to add it)
```

> Note: Names and structure may vary slightly based on your local setup, but this is the intended organization.

---

## ✅ Prerequisites

Make sure you have:

- **Node.js** (v16+ recommended)
- **SQL Server** (e.g., `SQLEXPRESS` instance on Windows)
- A database created with the name you choose (e.g., `SalesManagement`)
- An admin user row in the `AdminUser` table (to log in)

---

## 🗄 Database Schema (Overview)

Minimal tables used by the project:

```sql
-- Admin user (for login)
CREATE TABLE AdminUser (
    AdminId     INT IDENTITY(1,1) PRIMARY KEY,
    Username    NVARCHAR(50) NOT NULL,
    Password    NVARCHAR(255) NOT NULL
);

-- Products
CREATE TABLE Product (
    Product_id  INT IDENTITY(1,1) PRIMARY KEY,
    Pname       NVARCHAR(100) NOT NULL,
    price       DECIMAL(18,2) NOT NULL
);

-- Customers
CREATE TABLE Customer (
    Customer_id INT IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(100) NOT NULL,
    Phone       NVARCHAR(50) NULL,
    email       NVARCHAR(100) NULL
);

-- Orders (header)
CREATE TABLE Orders (
    Order_id    INT IDENTITY(1,1) PRIMARY KEY,
    Order_date  DATE NOT NULL,
    Customer_id INT NOT NULL
        FOREIGN KEY REFERENCES Customer(Customer_id)
);

-- Order items (details)
CREATE TABLE Order_item (
    Order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    Order_id      INT NOT NULL
        FOREIGN KEY REFERENCES Orders(Order_id),
    Product_id    INT NOT NULL
        FOREIGN KEY REFERENCES Product(Product_id),
    Quantity      INT NOT NULL,
    unitPrice     DECIMAL(18,2) NOT NULL
);
```

Insert at least one admin user:

```sql
INSERT INTO AdminUser (Username, Password)
VALUES ('admin', 'admin123'); -- Change the password later!
```

---

## ⚙️ Environment Variables

The application uses a `.env` file to configure the database and session.

Create a file named **`.env`** in the project root:

```env
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SERVER=YOUR_SERVER_NAME
DB_PORT=0
DB_NAME=SalesManagement

SESSION_SECRET=change_this_to_a_strong_secret
```

> Adjust values to match your local SQL Server setup.

You can also add an `.env.example` file to share a template without secrets.

---

## 🚀 Setup & Run

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Prepare your database**

   - Create a SQL Server database (e.g., `SalesManagement`).
   - Create the tables shown above.
   - Insert at least one row into `AdminUser` for login.

3. **Create `.env`**

   ```bash
   copy .env.example .env   # On Windows (optional, if you created .env.example)
   # or create it manually and fill in the variables
   ```

4. **Start the server**

   ```bash
   node server.js
   ```

   You should see:

   ```text
   🚀 Server running on http://localhost:4000
   DB CONFIG IN USE: ...
   ```

5. **Open the app in your browser**

   - Landing page:  
     `http://localhost:4000/`
   - Login page (direct link):  
     `http://localhost:4000/login.html`

---

## 🧩 Main Screens & Flows

### 1. Landing Page (`/`)

- Describes the system.
- Has animated hero, features, steps, and call-to-action.
- Smooth scrolling to sections:
  - About
  - Features
  - How it works
- Footer with social icons (Facebook, Instagram, GitHub, Email).

### 2. Login (`/login.html`)

- Simple admin login form.
- Sends a POST request to `/api/login`.
- On success, redirects to `dashboard.html`.
- Uses **sessions** to keep you logged in across page refreshes.

### 3. Dashboard (`/dashboard.html`)

Tabs:

- **Products**
  - Add / edit / delete products.
  - Table with ID, name, price, and actions.

- **Customers**
  - Add / edit / delete customers.
  - Table with ID, name, phone, email, and actions.

- **Orders**
  - Select customer + product.
  - Enter quantity and unit price (pre-filled from product if desired).
  - Choose order date (defaults to today).
  - See all orders with line totals and delete option.

- **Sales Reports**
  - Filter by:
    - Date range
    - Customer (optional)
  - Show:
    - Total sales
    - Total orders
    - Total quantity
  - Detailed rows with:
    - Serial row number (RowNo)
    - Order date
    - Customer name
    - Product name
    - Quantity
    - Unit price
    - Line total
  - **Export CSV** button:
    - Exports the current report rows as `sales_report.csv`.
    - Uses BOM so Arabic text looks correct in Excel.

---

## 🔐 Sessions & Security Notes

- Uses `express-session` with a named cookie: `sales.sid`.
- Session data stores the logged-in user (`AdminId`, `Username`).
- All CRUD APIs (`/api/products`, `/api/customers`, `/api/orders`, `/api/stats`, `/api/report/sales`) use a `requireAuth` middleware to ensure:
  - Only authenticated users can access the data.

> For production, you should:
> - Use a stronger `SESSION_SECRET`.
> - Enable `cookie.secure = true` behind HTTPS.
> - Hash passwords instead of storing them in plain text.

---

## 🎨 Animations & UX

- **GSAP** powers:
  - Header + hero entrance animations.
  - Floating glass dashboard card.
  - Table line pulse effect.
  - Scroll-in animation for feature cards and step cards.
  - Hover & click animation for cards and navbar links.

- **CSS**
  - RTL layout for Arabic content.
  - Glassmorphism style dashboard.
  - Responsive grid for stats and sections.

---

## 🧭 Possible Future Improvements

Some ideas you can add later:

- Pagination for tables (products, customers, orders).
- Search and filters per tab.
- Multiple products per order (full invoice).
- User roles (multi-admin, cashier, etc.).
- Dark / light theme toggle.
- Deploy to a production server or cloud (with proper DB connection).

---

## 📄 License

This project is provided for **educational and personal use**.
You may adapt and extend it for your own learning or internal tools.

If you use it in a public or commercial context, please make sure to:

- Remove any hard-coded demo credentials.
- Secure your database and sessions.
- Review best practices for authentication, authorization, and data protection.
