// file: server.js
const express = require('express');
const session = require('express-session');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();

// إعدادات الاتصال بـ SQL Server
const dbConfig = {
  user: 'sales_user',
  password: 'Sales@123',
  server: 'PROFE\\SQLEXPRESS',
  port: 0, // نستخدم 0 مع SQLEXPRESS حتى يعمل instance lookup
  database: 'SalesManagement',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

console.log('DB CONFIG IN USE:', dbConfig);

// ميدل وير أساسية
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// السيشن (الجلسات) – حتى يحفظ تسجيل الدخول
app.use(
  session({
    name: 'sales.sid', // اسم الكوكي
    secret: 'SalesManagement_SuperSecret_12345', // غيّريها لاحقاً لشي قوي
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // يوم كامل
      // secure: false // خليه false لأننا نشتغل على http وليس https
    }
  })
);

// تقديم ملفات الواجهة من فولدر public
app.use(express.static(path.join(__dirname, 'public')));

// إعداد Pool واحد للاتصال
let pool;
async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(dbConfig);
  return pool;
}

// ميدل وير للتحقق من تسجيل الدخول
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

// =====================
//      Auth APIs
// =====================

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password)
      .query(`
        SELECT AdminId, Username
        FROM AdminUser
        WHERE Username = @username AND Password = @password
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const user = result.recordset[0];

    // حفظ المستخدم في السيشن
    req.session.user = {
      id: user.AdminId,
      username: user.Username
    };

    res.json({ message: 'تم تسجيل الدخول بنجاح', user: req.session.user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Error during login' });
  }
});

// معلومات المستخدم الحالي
app.get('/api/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ user: req.session.user });
  }
  return res.status(401).json({ message: 'Not logged in' });
});

// تسجيل الخروج
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Error during logout' });
    }
    // نمسح كوكي الجلسة
    res.clearCookie('sales.sid');
    res.json({ message: 'تم تسجيل الخروج' });
  });
});

// مثال على API محمية (dashboard)
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: 'أهلاً بك في لوحة التحكم', user: req.session.user });
});

// =====================
//   Product APIs (محميّة)
// =====================

// جلب كل المنتجات
app.get('/api/products', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT Product_id, Pname, price FROM Product ORDER BY Product_id DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// إضافة منتج جديد
app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const { Pname, price } = req.body;

    if (!Pname || price == null) {
      return res.status(400).json({ message: 'الاسم والسعر مطلوبان' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('Pname', sql.NVarChar, Pname)
      .input('price', sql.Decimal(18, 2), price)
      .query(`
        INSERT INTO Product (Pname, price)
        OUTPUT INSERTED.Product_id, INSERTED.Pname, INSERTED.price
        VALUES (@Pname, @price)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// تعديل منتج
app.put('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const { Pname, price } = req.body;

    if (!Pname || price == null) {
      return res.status(400).json({ message: 'الاسم والسعر مطلوبان' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('Product_id', sql.Int, productId)
      .input('Pname', sql.NVarChar, Pname)
      .input('price', sql.Decimal(18, 2), price)
      .query(`
        UPDATE Product
        SET Pname = @Pname, price = @price
        WHERE Product_id = @Product_id;

        SELECT Product_id, Pname, price
        FROM Product
        WHERE Product_id = @Product_id;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// حذف منتج
app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const pool = await getPool();

    await pool.request()
      .input('Product_id', sql.Int, productId)
      .query(`
        DELETE FROM Order_item WHERE Product_id = @Product_id;
        DELETE FROM Product    WHERE Product_id = @Product_id;
      `);

    res.json({ message: 'تم حذف المنتج (والبنود المرتبطة به إن وجدت)' });
  } catch (err) {
    console.error('Error deleting product:', err);

    if (err.number === 547) {
      return res.status(400).json({ message: 'لا يمكن حذف المنتج لأنه مرتبط بطلبات' });
    }

    res.status(500).json({ message: 'Error deleting product' });
  }
});

// =====================
//   Customer APIs (محميّة)
// =====================

// جلب كل العملاء
app.get('/api/customers', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT Customer_id, Name, Phone, email FROM Customer ORDER BY Customer_id DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ message: 'Error fetching customers' });
  }
});

// إضافة عميل جديد
app.post('/api/customers', requireAuth, async (req, res) => {
  try {
    const { Name, Phone, email } = req.body;

    if (!Name) {
      return res.status(400).json({ message: 'اسم العميل مطلوب' });
    }

    const cleanPhone = Phone && Phone.trim() !== '' ? Phone.trim() : null;
    const cleanEmail = email && email.trim() !== '' ? email.trim() : null;

    const pool = await getPool();
    const result = await pool.request()
      .input('Name', sql.NVarChar, Name)
      .input('Phone', sql.NVarChar, cleanPhone)
      .input('email', sql.NVarChar, cleanEmail)
      .query(`
        INSERT INTO Customer (Name, Phone, email)
        OUTPUT INSERTED.Customer_id, INSERTED.Name, INSERTED.Phone, INSERTED.email
        VALUES (@Name, @Phone, @email);
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ message: 'Error creating customer' });
  }
});

// تعديل عميل
app.put('/api/customers/:id', requireAuth, async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const { Name, Phone, email } = req.body;

    if (!Name) {
      return res.status(400).json({ message: 'اسم العميل مطلوب' });
    }

    const cleanPhone = Phone && Phone.trim() !== '' ? Phone.trim() : null;
    const cleanEmail = email && email.trim() !== '' ? email.trim() : null;

    const pool = await getPool();
    const result = await pool.request()
      .input('Customer_id', sql.Int, customerId)
      .input('Name', sql.NVarChar, Name)
      .input('Phone', sql.NVarChar, cleanPhone)
      .input('email', sql.NVarChar, cleanEmail)
      .query(`
        UPDATE Customer
        SET Name  = @Name,
            Phone = @Phone,
            email = @email
        WHERE Customer_id = @Customer_id;

        SELECT Customer_id, Name, Phone, email
        FROM Customer
        WHERE Customer_id = @Customer_id;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ message: 'Error updating customer' });
  }
});

// حذف عميل
app.delete('/api/customers/:id', requireAuth, async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const pool = await getPool();

    await pool.request()
      .input('Customer_id', sql.Int, customerId)
      .query(`
        DELETE OI
        FROM Order_item OI
        JOIN Orders O ON OI.Order_id = O.Order_id
        WHERE O.Customer_id = @Customer_id;

        DELETE FROM Orders WHERE Customer_id = @Customer_id;

        DELETE FROM Customer WHERE Customer_id = @Customer_id;
      `);

    res.json({ message: 'تم حذف العميل (والطلبات المرتبطة به إن وجدت)' });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ message: 'Error deleting customer' });
  }
});

// =====================
//   Orders APIs (محميّة)
// =====================

// جلب كل الطلبيات (Order + Customer + Product + Order_item)
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        O.Order_id,
        O.Order_date,
        C.Name       AS CustomerName,
        C.Customer_id,
        P.Product_id,
        P.Pname      AS ProductName,
        OI.Quantity,
        OI.unitPrice,
        (OI.Quantity * OI.unitPrice) AS LineTotal
      FROM Orders O
      JOIN Customer  C ON O.Customer_id = C.Customer_id
      JOIN Order_item OI ON O.Order_id = OI.Order_id
      JOIN Product   P ON OI.Product_id = P.Product_id
      ORDER BY O.Order_id DESC;
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// إضافة طلب جديد (طلب = عميل + منتج واحد + كمية + سعر)
app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { customerId, productId, quantity, unitPrice, orderDate } = req.body;

    if (!customerId || !productId || !quantity || !unitPrice) {
      return res.status(400).json({ message: 'العميل، المنتج، الكمية، والسعر مطلوبة' });
    }

    const pool = await getPool();

    // 1) إدخال سجل في Orders
    const dateToUse = orderDate ? new Date(orderDate) : new Date();

    const orderResult = await pool.request()
      .input('Customer_id', sql.Int, customerId)
      .input('Order_date', sql.Date, dateToUse)
      .query(`
        INSERT INTO Orders (Order_date, Customer_id)
        OUTPUT INSERTED.Order_id
        VALUES (@Order_date, @Customer_id);
      `);

    const newOrderId = orderResult.recordset[0].Order_id;

    // 2) إدخال بند واحد في Order_item
    await pool.request()
      .input('Order_id', sql.Int, newOrderId)
      .input('Product_id', sql.Int, productId)
      .input('Quantity', sql.Int, quantity)
      .input('unitPrice', sql.Decimal(18, 2), unitPrice)
      .query(`
        INSERT INTO Order_item (Order_id, Product_id, Quantity, unitPrice)
        VALUES (@Order_id, @Product_id, @Quantity, @unitPrice);
      `);

    // 3) جلب الطلب الكامل مع البيانات المرتبطة
    const fullOrder = await pool.request()
      .input('Order_id', sql.Int, newOrderId)
      .query(`
        SELECT
          O.Order_id,
          O.Order_date,
          C.Name       AS CustomerName,
          C.Customer_id,
          P.Product_id,
          P.Pname      AS ProductName,
          OI.Quantity,
          OI.unitPrice,
          (OI.Quantity * OI.unitPrice) AS LineTotal
        FROM Orders O
        JOIN Customer  C ON O.Customer_id = C.Customer_id
        JOIN Order_item OI ON O.Order_id = OI.Order_id
        JOIN Product   P ON OI.Product_id = P.Product_id
        WHERE O.Order_id = @Order_id;
      `);

    res.status(201).json(fullOrder.recordset[0]);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Error creating order' });
  }
});

// حذف طلب كامل (أولاً البنود ثم الطلب)
app.delete('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const pool = await getPool();

    await pool.request()
      .input('Order_id', sql.Int, orderId)
      .query(`
        DELETE FROM Order_item WHERE Order_id = @Order_id;
        DELETE FROM Orders     WHERE Order_id = @Order_id;
      `);

    res.json({ message: 'تم حذف الطلب (والبنود المرتبطة به)' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ message: 'Error deleting order' });
  }
});

// =====================
//   Stats APIs (محميّة)
// =====================

app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Product) AS totalProducts,
        (SELECT COUNT(*) FROM Customer) AS totalCustomers,
        (SELECT COUNT(*) FROM Orders)   AS totalOrders,
        (SELECT ISNULL(SUM(OI.Quantity * OI.unitPrice), 0)
           FROM Order_item OI)          AS totalSales,
        (SELECT ISNULL(SUM(OI.Quantity * OI.unitPrice), 0)
           FROM Orders O
           JOIN Order_item OI ON O.Order_id = OI.Order_id
           WHERE CONVERT(date, O.Order_date) = CONVERT(date, GETDATE())
        ) AS todaySales
    `);

  const stats = result.recordset[0] || {
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalSales: 0,
    todaySales: 0
  };

  res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// =====================
//  Sales Report API (محميّة)
// =====================
app.get('/api/report/sales', requireAuth, async (req, res) => {
  try {
    const { from, to, customerId } = req.query;

    const fromDate = from ? new Date(from) : null;
    const toDate   = to   ? new Date(to)   : null;
    const custId   = customerId ? parseInt(customerId, 10) : null;

    //console.log('REPORT PARAMS:', { fromDate, toDate, custId });

    const pool = await getPool();
    const request = pool.request()
      .input('fromDate',   sql.Date, fromDate)
      .input('toDate',     sql.Date, toDate)
      .input('customerId', sql.Int,  custId);

    const result = await request.query(`
      -- الملخص
      SELECT
        ISNULL(SUM(OI.Quantity * OI.unitPrice), 0) AS totalSales,
        COUNT(DISTINCT O.Order_id)                 AS totalOrders,
        ISNULL(SUM(OI.Quantity), 0)                AS totalQuantity
      FROM Orders O
      JOIN Customer  C ON O.Customer_id = C.Customer_id
      JOIN Order_item OI ON O.Order_id = OI.Order_id
      JOIN Product   P ON OI.Product_id = P.Product_id
      WHERE
        (@fromDate IS NULL OR O.Order_date >= @fromDate)
        AND (@toDate   IS NULL OR O.Order_date <= @toDate)
        AND (@customerId IS NULL OR C.Customer_id = @customerId);

      -- التفاصيل مع رقم تسلسلي للعرض فقط
      SELECT
        ROW_NUMBER() OVER (ORDER BY O.Order_date DESC, O.Order_id DESC) AS RowNo,
        O.Order_id,
        O.Order_date,
        C.Customer_id,
        C.Name        AS CustomerName,
        P.Product_id,
        P.Pname       AS ProductName,
        OI.Quantity,
        OI.unitPrice,
        (OI.Quantity * OI.unitPrice) AS LineTotal
      FROM Orders O
      JOIN Customer  C ON O.Customer_id = C.Customer_id
      JOIN Order_item OI ON O.Order_id = OI.Order_id
      JOIN Product   P ON OI.Product_id = P.Product_id
      WHERE
        (@fromDate IS NULL OR O.Order_date >= @fromDate)
        AND (@toDate   IS NULL OR O.Order_date <= @toDate)
        AND (@customerId IS NULL OR C.Customer_id = @customerId)
      ORDER BY O.Order_date DESC, O.Order_id DESC;
    `);

    const summary = (result.recordsets[0] && result.recordsets[0][0]) || {
      totalSales: 0,
      totalOrders: 0,
      totalQuantity: 0
    };

    const rows = result.recordsets[1] || [];

    return res.json({
      totalSales: summary.totalSales,
      totalOrders: summary.totalOrders,
      totalQuantity: summary.totalQuantity,
      rows
    });
  } catch (err) {
    console.error('Error fetching sales report:', err);
    return res.status(500).json({ message: 'Error fetching sales report' });
  }
});




// تشغيل السيرفر
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
