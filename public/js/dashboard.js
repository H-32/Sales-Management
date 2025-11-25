
document.addEventListener('DOMContentLoaded', () => {
  // عناصر عامة
  const currentUserSpan = document.getElementById('currentUser');
  const logoutBtn = document.getElementById('logoutBtn');

  // تبويبات
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // عناصر المنتجات
  const productForm = document.getElementById('productForm');
  const productIdInput = document.getElementById('productId');
  const productNameInput = document.getElementById('productName');
  const productPriceInput = document.getElementById('productPrice');
  const saveProductBtn = document.getElementById('saveProductBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const productMessage = document.getElementById('productMessage');
  const productsTableBody = document.querySelector('#productsTable tbody');

  // عناصر العملاء
  const customerForm = document.getElementById('customerForm');
  const customerIdInput = document.getElementById('customerId');
  const customerNameInput = document.getElementById('customerName');
  const customerPhoneInput = document.getElementById('customerPhone');
  const customerEmailInput = document.getElementById('customerEmail');
  const saveCustomerBtn = document.getElementById('saveCustomerBtn');
  const cancelCustomerEditBtn = document.getElementById('cancelCustomerEditBtn');
  const customerMessage = document.getElementById('customerMessage');
  const customersTableBody = document.querySelector('#customersTable tbody');

  // عناصر الطلبيات
  const orderForm = document.getElementById('orderForm');
  const orderCustomerSelect = document.getElementById('orderCustomer');
  const orderProductSelect = document.getElementById('orderProduct');
  const orderQuantityInput = document.getElementById('orderQuantity');
  const orderUnitPriceInput = document.getElementById('orderUnitPrice');
  const orderDateInput = document.getElementById('orderDate');
  const orderMessage = document.getElementById('orderMessage');
  const ordersTableBody = document.querySelector('#ordersTable tbody');

  // عناصر الإحصائيات
  const statTotalSales = document.getElementById('statTotalSales');
  const statTodaySales = document.getElementById('statTodaySales');
  const statTotalOrders = document.getElementById('statTotalOrders');
  const statTotalCustomers = document.getElementById('statTotalCustomers');
  const statTotalProducts = document.getElementById('statTotalProducts');

  // عناصر تقارير المبيعات
  const reportForm = document.getElementById('reportForm');
  const reportFromDateInput = document.getElementById('reportFromDate');
  const reportToDateInput = document.getElementById('reportToDate');
  const reportCustomerSelect = document.getElementById('reportCustomer');
  const reportTotalSalesSpan = document.getElementById('reportTotalSales');
  const reportTotalOrdersSpan = document.getElementById('reportTotalOrders');
  const reportTotalQuantitySpan = document.getElementById('reportTotalQuantity');
  const reportMessage = document.getElementById('reportMessage');
  const reportTableBody = document.querySelector('#reportTable tbody');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  // نخزن آخر بيانات تقرير حتى نستخدمها بتصدير CSV
  let lastReportRows = [];

  // أنيميشن دخول الداشبورد
  if (window.gsap) {
    gsap.from('.dashboard-header', {
      duration: 0.6,
      y: -40,
      opacity: 0,
      ease: 'power2.out'
    });

    gsap.from('.dashboard-nav', {
      duration: 0.6,
      y: -20,
      opacity: 0,
      delay: 0.2,
      ease: 'power2.out'
    });

    gsap.from('.panel', {
      duration: 0.7,
      y: 20,
      opacity: 0,
      delay: 0.35,
      ease: 'power2.out'
    });

    gsap.from('.stat-card', {
      duration: 0.6,
      y: 15,
      opacity: 0,
      delay: 0.25,
      stagger: 0.05,
      ease: 'power2.out'
    });
  }

  // مساعدة بسيطة لتنسيق التاريخ
  function formatDate(d) {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return d.toString().slice(0, 10);
    return dateObj.toISOString().slice(0, 10);
  }

  // 1) التحقق من المستخدم الحالي
  fetch('/api/me')
    .then(res => {
      if (res.status === 401) {
        window.location.href = 'login.html';
      }
      return res.json();
    })
    .then(data => {
      if (data.user) {
        currentUserSpan.textContent = 'مرحباً، ' + data.user.username;
      }
    })
    .catch(err => {
      console.error(err);
      currentUserSpan.textContent = 'خطأ في تحميل المستخدم';
    });

  // 2) تسجيل الخروج
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      fetch('/api/logout', { method: 'POST' })
        .then(res => res.json())
        .then(() => {
          window.location.href = 'login.html';
        })
        .catch(err => console.error(err));
    });
  }

  // 3) التبويبات (Products / Customers / Orders / Reports)
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;

      const target = btn.dataset.tab;

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(sec => sec.classList.remove('active'));

      btn.classList.add('active');
      const section = document.getElementById('tab-' + target);
      if (section) section.classList.add('active');

      if (target === 'products') {
        loadProducts();
      } else if (target === 'customers') {
        loadCustomers();
      } else if (target === 'orders') {
        initOrdersTab();
      } else if (target === 'reports') {
        initReportsTab();
      }
    });
  });

  // ==========================
  //   دالة الإحصائيات (Stats)
  // ==========================

  async function loadStats() {
    if (!statTotalSales) return;

    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('فشل في جلب الإحصائيات');

      const s = await res.json();

      const updateNumber = (el, value, suffix = '') => {
        if (!el) return;
        const target = Number(value || 0);
        const prev = Number(el.dataset.value || '0');

        if (window.gsap) {
          const obj = { val: prev };
          gsap.to(obj, {
            val: target,
            duration: 0.8,
            ease: 'power1.out',
            onUpdate() {
              el.textContent = Math.round(obj.val).toLocaleString('ar-IQ') + suffix;
            }
          });
        } else {
          el.textContent = target.toLocaleString('ar-IQ') + suffix;
        }

        el.dataset.value = target;
      };

      updateNumber(statTotalSales, s.totalSales, ' د.ع');
      updateNumber(statTodaySales, s.todaySales, ' د.ع');
      updateNumber(statTotalOrders, s.totalOrders);
      updateNumber(statTotalCustomers, s.totalCustomers);
      updateNumber(statTotalProducts, s.totalProducts);

    } catch (err) {
      console.error(err);
    }
  }

  // ==========================
  //   المنتجات (Products)
  // ==========================

  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('فشل في جلب المنتجات');

      const products = await res.json();
      renderProducts(products);
      animateProductRows();
    } catch (err) {
      console.error(err);
      productMessage.textContent = 'حدث خطأ أثناء تحميل المنتجات';
      productMessage.style.color = 'red';
    }
  }

  // 🔹 هنا التعديل: نعرض تسلسل بدلاً من Product_id
  function renderProducts(products) {
    productsTableBody.innerHTML = '';

    if (!products || products.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.textContent = 'لا توجد منتجات حالياً.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      productsTableBody.appendChild(tr);
      return;
    }

    products.forEach((p, index) => {
      const rowNumber = index + 1;
      const tr = document.createElement('tr');
      tr.classList.add('product-row');

      tr.innerHTML = `
        <td>${rowNumber}</td>
        <td>${p.Pname}</td>
        <td>${Number(p.price).toFixed(2)}</td>
        <td>
          <button class="btn small" data-action="edit-product" data-id="${p.Product_id}">تعديل</button>
          <button class="btn small danger" data-action="delete-product" data-id="${p.Product_id}">حذف</button>
        </td>
      `;

      productsTableBody.appendChild(tr);
    });
  }

  function animateProductRows() {
    if (!window.gsap) return;
    gsap.from('.product-row', {
      duration: 0.4,
      y: 10,
      opacity: 0,
      stagger: 0.05,
      ease: 'power1.out'
    });
  }

  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      productMessage.textContent = '';

      const id = productIdInput.value;
      const name = productNameInput.value.trim();
      const price = productPriceInput.value;

      if (!name || !price) {
        productMessage.textContent = 'يرجى إدخال اسم المنتج والسعر.';
        productMessage.style.color = 'red';
        return;
      }

      try {
        let url = '/api/products';
        let method = 'POST';

        if (id) {
          url = `/api/products/${id}`;
          method = 'PUT';
        }

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Pname: name, price: parseFloat(price) })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'خطأ أثناء حفظ المنتج');
        }

        productMessage.textContent = id ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح';
        productMessage.style.color = 'green';

        resetProductForm();
        loadProducts();
        loadStats();

      } catch (err) {
        console.error(err);
        productMessage.textContent = err.message;
        productMessage.style.color = 'red';
      }
    });
  }

  function resetProductForm() {
    productIdInput.value = '';
    productNameInput.value = '';
    productPriceInput.value = '';
    saveProductBtn.textContent = 'إضافة منتج';
    cancelEditBtn.style.display = 'none';
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      resetProductForm();
    });
  }

  if (productsTableBody) {
    productsTableBody.addEventListener('click', async (e) => {
      const btn = e.target;
      if (btn.tagName.toLowerCase() !== 'button') return;

      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');

      if (action === 'edit-product') {
        const row = btn.closest('tr');
        const name = row.children[1].textContent;
        const price = row.children[2].textContent;

        productIdInput.value = id;
        productNameInput.value = name;
        productPriceInput.value = price;
        saveProductBtn.textContent = 'تحديث المنتج';
        cancelEditBtn.style.display = 'inline-block';
        productMessage.textContent = '';
        productMessage.style.color = '';
      }

      if (action === 'delete-product') {
        const confirmDelete = confirm('هل أنت متأكد من حذف هذا المنتج؟');
        if (!confirmDelete) return;

        try {
          const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || 'فشل حذف المنتج');
          }

          productMessage.textContent = data.message || 'تم حذف المنتج';
          productMessage.style.color = 'green';
          loadProducts();
          loadStats();

        } catch (err) {
          console.error(err);
          productMessage.textContent = err.message;
          productMessage.style.color = 'red';
        }
      }
    });
  }

  // ==========================
  //   العملاء (Customers)
  // ==========================

  async function loadCustomers() {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('فشل في جلب العملاء');

      const customers = await res.json();
      renderCustomers(customers);
      animateCustomerRows();
    } catch (err) {
      console.error(err);
      customerMessage.textContent = 'حدث خطأ أثناء تحميل العملاء';
      customerMessage.style.color = 'red';
    }
  }

  // 🔹 هنا التعديل: نعرض تسلسل بدلاً من Customer_id
  function renderCustomers(customers) {
    customersTableBody.innerHTML = '';

    if (!customers || customers.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'لا توجد بيانات عملاء حالياً.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      customersTableBody.appendChild(tr);
      return;
    }

    customers.forEach((c, index) => {
      const rowNumber = index + 1;
      const tr = document.createElement('tr');
      tr.classList.add('customer-row');

      tr.innerHTML = `
        <td>${rowNumber}</td>
        <td>${c.Name}</td>
        <td>${c.Phone || ''}</td>
        <td>${c.email || ''}</td>
        <td>
          <button class="btn small" data-action="edit-customer" data-id="${c.Customer_id}">تعديل</button>
          <button class="btn small danger" data-action="delete-customer" data-id="${c.Customer_id}">حذف</button>
        </td>
      `;

      customersTableBody.appendChild(tr);
    });
  }

  function animateCustomerRows() {
    if (!window.gsap) return;
    gsap.from('.customer-row', {
      duration: 0.4,
      y: 10,
      opacity: 0,
      stagger: 0.05,
      ease: 'power1.out'
    });
  }

  if (customerForm) {
    customerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      customerMessage.textContent = '';

      const id = customerIdInput.value;
      const name = customerNameInput.value.trim();
      const phone = customerPhoneInput.value.trim();
      const email = customerEmailInput.value.trim();

      if (!name) {
        customerMessage.textContent = 'يرجى إدخال اسم العميل.';
        customerMessage.style.color = 'red';
        return;
      }

      try {
        let url = '/api/customers';
        let method = 'POST';

        if (id) {
          url = `/api/customers/${id}`;
          method = 'PUT';
        }

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Name: name,
            Phone: phone || null,
            email: email || null
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'خطأ أثناء حفظ بيانات العميل');
        }

        customerMessage.textContent = id ? 'تم تحديث بيانات العميل' : 'تم إضافة العميل بنجاح';
        customerMessage.style.color = 'green';

        resetCustomerForm();
        loadCustomers();
        loadStats();

      } catch (err) {
        console.error(err);
        customerMessage.textContent = err.message;
        customerMessage.style.color = 'red';
      }
    });
  }

  function resetCustomerForm() {
    customerIdInput.value = '';
    customerNameInput.value = '';
    customerPhoneInput.value = '';
    customerEmailInput.value = '';
    saveCustomerBtn.textContent = 'إضافة عميل';
    cancelCustomerEditBtn.style.display = 'none';
  }

  if (cancelCustomerEditBtn) {
    cancelCustomerEditBtn.addEventListener('click', () => {
      resetCustomerForm();
    });
  }

  if (customersTableBody) {
    customersTableBody.addEventListener('click', async (e) => {
      const btn = e.target;
      if (btn.tagName.toLowerCase() !== 'button') return;

      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');

      if (action === 'edit-customer') {
        const row = btn.closest('tr');
        const name = row.children[1].textContent;
        const phone = row.children[2].textContent;
        const email = row.children[3].textContent;

        customerIdInput.value = id;
        customerNameInput.value = name;
        customerPhoneInput.value = phone;
        customerEmailInput.value = email;
        saveCustomerBtn.textContent = 'تحديث العميل';
        cancelCustomerEditBtn.style.display = 'inline-block';
        customerMessage.textContent = '';
        customerMessage.style.color = '';
      }

      if (action === 'delete-customer') {
        const confirmDelete = confirm('هل أنت متأكد من حذف هذا العميل وكل طلباته؟');
        if (!confirmDelete) return;

        try {
          const res = await fetch(`/api/customers/${id}`, {
            method: 'DELETE'
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || 'فشل حذف العميل');
          }

          customerMessage.textContent = data.message || 'تم حذف العميل';
          customerMessage.style.color = 'green';
          loadCustomers();
          loadStats();

        } catch (err) {
          console.error(err);
          customerMessage.textContent = err.message;
          customerMessage.style.color = 'red';
        }
      }
    });
  }

  // ==========================
  //   الطلبيات (Orders)
  // ==========================

  if (orderDateInput) {
    const today = new Date().toISOString().split('T')[0];
    orderDateInput.value = today;
  }

  async function initOrdersTab() {
    await Promise.all([
      populateOrderCustomers(),
      populateOrderProducts(),
      loadOrders()
    ]);
  }

  async function populateOrderCustomers() {
    if (!orderCustomerSelect) return;
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('فشل في جلب العملاء');

      const customers = await res.json();
      orderCustomerSelect.innerHTML = '<option value="">اختر عميلًا</option>';

      customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.Customer_id;
        opt.textContent = c.Name;
        orderCustomerSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      orderMessage.textContent = 'خطأ في تحميل قائمة العملاء';
      orderMessage.style.color = 'red';
    }
  }

  async function populateOrderProducts() {
    if (!orderProductSelect) return;
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('فشل في جلب المنتجات');

      const products = await res.json();
      orderProductSelect.innerHTML = '<option value="">اختر منتجًا</option>';

      products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.Product_id;
        opt.textContent = p.Pname;
        opt.setAttribute('data-price', p.price);
        orderProductSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      orderMessage.textContent = 'خطأ في تحميل قائمة المنتجات';
      orderMessage.style.color = 'red';
    }
  }

  if (orderProductSelect && orderUnitPriceInput) {
    orderProductSelect.addEventListener('change', () => {
      const selected = orderProductSelect.options[orderProductSelect.selectedIndex];
      const price = selected ? selected.getAttribute('data-price') : '';
      if (price) {
        orderUnitPriceInput.value = Number(price).toFixed(2);
      }
    });
  }

  async function loadOrders() {
    if (!ordersTableBody) return;
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('فشل في جلب الطلبيات');

      const orders = await res.json();
      renderOrders(orders);
      animateOrderRows();
    } catch (err) {
      console.error(err);
      orderMessage.textContent = 'حدث خطأ أثناء تحميل الطلبيات';
      orderMessage.style.color = 'red';
    }
  }

  // 🔹 هنا التعديل: نعرض تسلسل بدلاً من Order_id
  function renderOrders(orders) {
    ordersTableBody.innerHTML = '';

    if (!orders || orders.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 8;
      td.textContent = 'لا توجد طلبيات حالياً.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      ordersTableBody.appendChild(tr);
      return;
    }

    orders.forEach((o, index) => {
      const rowNumber = index + 1;
      const tr = document.createElement('tr');
      tr.classList.add('order-row');

      tr.innerHTML = `
        <td>${rowNumber}</td>
        <td>${formatDate(o.Order_date)}</td>
        <td>${o.CustomerName}</td>
        <td>${o.ProductName}</td>
        <td>${o.Quantity}</td>
        <td>${Number(o.unitPrice).toFixed(2)}</td>
        <td>${Number(o.LineTotal).toFixed(2)}</td>
        <td>
          <button class="btn small danger" data-action="delete-order" data-id="${o.Order_id}">حذف</button>
        </td>
      `;

      ordersTableBody.appendChild(tr);
    });
  }

  function animateOrderRows() {
    if (!window.gsap) return;
    gsap.from('.order-row', {
      duration: 0.4,
      y: 10,
      opacity: 0,
      stagger: 0.05,
      ease: 'power1.out'
    });
  }

  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      orderMessage.textContent = '';

      const customerId = parseInt(orderCustomerSelect.value, 10);
      const productId = parseInt(orderProductSelect.value, 10);
      const quantity = parseInt(orderQuantityInput.value, 10);
      const unitPrice = parseFloat(orderUnitPriceInput.value);
      const orderDate = orderDateInput.value || null;

      if (!customerId || !productId || !quantity || !unitPrice) {
        orderMessage.textContent = 'العميل، المنتج، الكمية، والسعر مطلوبة.';
        orderMessage.style.color = 'red';
        return;
      }

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            productId,
            quantity,
            unitPrice,
            orderDate
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'خطأ أثناء إضافة الطلب');
        }

        orderMessage.textContent = 'تم إضافة الطلب بنجاح';
        orderMessage.style.color = 'green';

        loadOrders();
        loadStats();

      } catch (err) {
        console.error(err);
        orderMessage.textContent = err.message;
        orderMessage.style.color = 'red';
      }
    });
  }

  if (ordersTableBody) {
    ordersTableBody.addEventListener('click', async (e) => {
      const btn = e.target;
      if (btn.tagName.toLowerCase() !== 'button') return;

      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');

      if (action === 'delete-order') {
        const confirmDelete = confirm('هل أنت متأكد من حذف هذا الطلب؟');
        if (!confirmDelete) return;

        try {
          const res = await fetch(`/api/orders/${id}`, {
            method: 'DELETE'
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || 'فشل حذف الطلب');
          }

          orderMessage.textContent = data.message || 'تم حذف الطلب';
          orderMessage.style.color = 'green';
          loadOrders();
          loadStats();
        } catch (err) {
          console.error(err);
          orderMessage.textContent = err.message;
          orderMessage.style.color = 'red';
        }
      }
    });
  }

  // ==========================
  //   تقارير المبيعات (Reports)
  // ==========================

  async function initReportsTab() {
    await populateReportCustomers();
    await loadSalesReport(); // بدون فلاتر = كل شيء
  }

  async function populateReportCustomers() {
    if (!reportCustomerSelect) return;
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('فشل في جلب العملاء');

      const customers = await res.json();
      reportCustomerSelect.innerHTML = '<option value="">كل العملاء</option>';

      customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.Customer_id;
        opt.textContent = c.Name;
        reportCustomerSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      reportMessage.textContent = 'خطأ في تحميل قائمة العملاء';
      reportMessage.style.color = 'red';
    }
  }

  async function loadSalesReport() {
    if (!reportTableBody) return;

    reportMessage.textContent = '';
    reportTableBody.innerHTML = '';

    const from = reportFromDateInput ? reportFromDateInput.value : '';
    const to = reportToDateInput ? reportToDateInput.value : '';
    const customerId = reportCustomerSelect ? reportCustomerSelect.value : '';

    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (customerId) params.append('customerId', customerId);

    const url = '/api/report/sales' + (params.toString() ? `?${params.toString()}` : '');

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('فشل في جلب تقرير المبيعات');

      const data = await res.json();

      lastReportRows = data.rows || [];

      // تحديث الخلاصة
      reportTotalSalesSpan.textContent =
        Number(data.totalSales || 0).toLocaleString('ar-IQ') + ' د.ع';
      reportTotalOrdersSpan.textContent =
        Number(data.totalOrders || 0).toLocaleString('ar-IQ');
      reportTotalQuantitySpan.textContent =
        Number(data.totalQuantity || 0).toLocaleString('ar-IQ');

      renderReportRows(lastReportRows);
      animateReportRows();
    } catch (err) {
      console.error(err);
      reportMessage.textContent = err.message;
      reportMessage.style.color = 'red';
    }
  }

  function renderReportRows(rows) {
    reportTableBody.innerHTML = '';

    if (!rows || rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.textContent = 'لا توجد بيانات ضمن الفترة المحددة.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      reportTableBody.appendChild(tr);
      return;
    }

    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.classList.add('report-row');

      tr.innerHTML = `
        <td>${r.RowNo}</td>
        <td>${formatDate(r.Order_date)}</td>
        <td>${r.CustomerName}</td>
        <td>${r.ProductName}</td>
        <td>${r.Quantity}</td>
        <td>${Number(r.unitPrice).toFixed(2)}</td>
        <td>${Number(r.LineTotal).toFixed(2)}</td>
      `;

      reportTableBody.appendChild(tr);
    });
  }

  function animateReportRows() {
    if (!window.gsap) return;
    gsap.from('.report-row', {
      duration: 0.4,
      y: 10,
      opacity: 0,
      stagger: 0.05,
      ease: 'power1.out'
    });
  }

  if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadSalesReport();
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      if (!lastReportRows || lastReportRows.length === 0) {
        alert('لا توجد بيانات لتصديرها.');
        return;
      }

      const header = [
        'OrderId',
        'OrderDate',
        'CustomerName',
        'ProductName',
        'Quantity',
        'UnitPrice',
        'LineTotal'
      ];

      const lines = [];
      lines.push(header.join(','));

      lastReportRows.forEach(r => {
        const row = [
          r.Order_id,
          formatDate(r.Order_date),
          `"${(r.CustomerName || '').replace(/"/g, '""')}"`,
          `"${(r.ProductName || '').replace(/"/g, '""')}"`,
          r.Quantity,
          Number(r.unitPrice).toFixed(2),
          Number(r.LineTotal).toFixed(2)
        ];
        lines.push(row.join(','));
      });

      const csvContent = lines.join('\r\n');
      const BOM = '\uFEFF';

      const blob = new Blob([BOM + csvContent], {
        type: 'text/csv;charset=utf-8;'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sales_report.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // تحميل المنتجات + الإحصائيات افتراضياً عند فتح الداشبورد
  loadProducts();
  loadStats();
});
