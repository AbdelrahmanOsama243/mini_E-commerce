# 📊 دليل إعداد وربط Google Looker Studio مع Mini E-Commerce

هذا الدليل يشرح بالتفصيل كيفية إعداد وتوصيل **Google Looker Studio (النسخة المجانية Free)** بـ Backend المشروع وعرض التقارير التحليلية في **Frontend (Angular)** و **Mobile (React Native)**.

---

## 🏗️ كيف يعمل الربط (Architecture)

```
┌────────────────────────────────────────────────────────┐
│                   Backend API Server                   │
│   GET /api/analytics/looker/export?apiKey=xxx          │
└──────────────────────────┬─────────────────────────────┘
                           │ (JSON Data Stream)
                           ▼
┌────────────────────────────────────────────────────────┐
│        Google Apps Script / Community Connector        │
│   (مجاني 100% — يحول الـ JSON إلى Looker Data Source)   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Google Looker Studio Report                │
│    - Global Sales KPI & Velocity                       │
│    - Multi-Admin Products Matrix                       │
│    - Customer Breakdown & Revenue Trends               │
└──────────────────────────┬─────────────────────────────┘
                           │ (iframe embed)
                           ▼
┌────────────────────────────────────────────────────────┐
│             Frontend / Mobile Applications             │
│    Angular: /admin/dashboard (Embedded Report Hub)     │
│    Mobile: Native Scoped Analytics + Looker status     │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 الخطوة 1: تجهيز الـ API Key في Backend

في ملف `.env` الخاص بالـ Backend:
```env
LOOKER_STUDIO_API_KEY=looker_studio_secret_key_12345
```

الـ Endpoint المخصص للتصدير إلى Looker Studio هو:
```http
GET http://localhost:3000/api/analytics/looker/export?apiKey=looker_studio_secret_key_12345
```
أو عبر ngrok / Domain الإنتاج الخاص بك:
```http
https://your-domain.com/api/analytics/looker/export?apiKey=looker_studio_secret_key_12345
```

### شكل البيانات التي يرجعها الـ Endpoint:
- **`metadata`**: تاريخ التصدير، إجمالي الأوردرات، المنتجات، والعملاء.
- **`orders`**: مصفوفة مسطحة (Flattened Array) بكل عنصر تم شراؤه (الاسم، التصنيف، السعر، الكمية، الإجمالي، طريقة الدفع، حالة الأوردر، اسم العميل، تاريخ الطلب).
- **`products`**: مصفوفة بكل المنتجات والأدمن المالك لكل منتج ومستوى المخزون.

---

## 🛠️ الخطوة 2: إنشاء Google Apps Script Community Connector (مجاناً)

1. ادخل على [Google Apps Script Dashboard](https://script.google.com/).
2. اضغط على **New Project** وسمّه `Mini-Ecommerce-Looker-Connector`.
3. استبدل محتوى ملف `Code.gs` بالكود التالي:

```javascript
function getAuthType() {
  return { type: 'NONE' };
}

function getConfig(request) {
  var config = {
    configParams: [
      {
        type: 'TEXTINPUT',
        name: 'apiUrl',
        displayName: 'Backend Analytics Export URL',
        helpText: 'Enter full endpoint URL with apiKey (e.g., https://your-domain.com/api/analytics/looker/export?apiKey=xxx)',
        placeholder: 'https://your-domain.com/api/analytics/looker/export?apiKey=xxx'
      }
    ]
  };
  return config;
}

function getFields() {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;

  fields.newDimension().setId('orderId').setName('Order ID').setType(types.TEXT);
  fields.newDimension().setId('orderDate').setName('Order Date').setType(types.YEAR_MONTH_DAY);
  fields.newDimension().setId('orderStatus').setName('Order Status').setType(types.TEXT);
  fields.newDimension().setId('paymentStatus').setName('Payment Status').setType(types.TEXT);
  fields.newDimension().setId('paymentMethod').setName('Payment Method').setType(types.TEXT);
  fields.newDimension().setId('customerName').setName('Customer Name').setType(types.TEXT);
  fields.newDimension().setId('customerEmail').setName('Customer Email').setType(types.TEXT);
  fields.newDimension().setId('productName').setName('Product Name').setType(types.TEXT);
  fields.newDimension().setId('category').setName('Category').setType(types.TEXT);
  fields.newDimension().setId('shippingAddress').setName('Shipping Address').setType(types.TEXT);

  fields.newMetric().setId('quantity').setName('Quantity Sold').setType(types.NUMBER).setAggregation(aggregations.SUM);
  fields.newMetric().setId('itemPrice').setName('Item Price').setType(types.CURRENCY_USD).setAggregation(aggregations.AVG);
  fields.newMetric().setId('itemSubtotal').setName('Total Revenue').setType(types.CURRENCY_USD).setAggregation(aggregations.SUM);

  return fields;
}

function getSchema(request) {
  return { schema: getFields().build() };
}

function getData(request) {
  var apiUrl = request.configParams.apiUrl;
  var response = UrlFetchApp.fetch(apiUrl);
  var json = JSON.parse(response.getContentText());
  var orders = json.orders || [];

  var dataSchema = [];
  request.fields.forEach(function(field) {
    for (var i = 0; i < getFields().build().length; i++) {
      if (getFields().build()[i].name === field.name) {
        dataSchema.push(getFields().build()[i]);
        break;
      }
    }
  });

  var rows = [];
  orders.forEach(function(item) {
    var values = [];
    request.fields.forEach(function(field) {
      switch (field.name) {
        case 'orderId': values.push(item.orderId); break;
        case 'orderDate': values.push(item.orderDate ? item.orderDate.substring(0, 10).replace(/-/g, '') : ''); break;
        case 'orderStatus': values.push(item.orderStatus); break;
        case 'paymentStatus': values.push(item.paymentStatus); break;
        case 'paymentMethod': values.push(item.paymentMethod); break;
        case 'customerName': values.push(item.customerName); break;
        case 'customerEmail': values.push(item.customerEmail); break;
        case 'productName': values.push(item.productName); break;
        case 'category': values.push(item.category); break;
        case 'shippingAddress': values.push(item.shippingAddress); break;
        case 'quantity': values.push(item.quantity); break;
        case 'itemPrice': values.push(item.itemPrice); break;
        case 'itemSubtotal': values.push(item.itemSubtotal); break;
        default: values.push('');
      }
    });
    rows.push({ values: values });
  });

  return {
    schema: dataSchema,
    rows: rows
  };
}
```

4. من القائمة العلوية اضغط على **Deploy** → **Test Deployments** أو **New Deployment** واضغط **Enable Community Connector**.
5. انسخ رابط الـ Connector وادخل به على Looker Studio.

---

## 📈 الخطوة 3: تصميم التقرير في Looker Studio

في [Google Looker Studio](https://lookerstudio.google.com/):

1. اضغط **Create** → **Report**.
2. اختر الـ Data Source الذي قمت بربطه.
3. قم بإضافة المكونات التالية:
   - **Scorecards**:
     - `SUM(itemSubtotal)`: إجمالي الإيرادات
     - `COUNT_DISTINCT(orderId)`: إجمالي الأوردرات
     - `SUM(quantity)`: إجمالي القطع المباعة
   - **Bar Chart (Top Selling Products)**:
     - Dimension: `productName`
     - Metric: `SUM(quantity)`
   - **Pie Chart (Payment Methods & Status)**:
     - Dimension: `paymentMethod`
     - Metric: `Record Count`
   - **Time Series Line Chart (Revenue Over Time)**:
     - Dimension: `orderDate`
     - Metric: `SUM(itemSubtotal)`
   - **Table with Heatmap (Low Stock / Order Logs)**:
     - Dimensions: `orderId`, `customerName`, `productName`, `orderStatus`
     - Metrics: `quantity`, `itemSubtotal`

---

## 🔗 الخطوة 4: تضمين التقرير (Embed) في الـ Frontend

1. من داخل Looker Studio اضغط على **File** → **Embed report**.
2. فعّل خيار **Enable embedding**.
3. انسخ رابط الـ `Embed URL` (وليس كود الـ iframe كاملاً، فقط الرابط مثل: `https://lookerstudio.google.com/embed/reporting/YOUR_REPORT_ID/page/YOUR_PAGE_ID`).
4. ضعه في ملفات البيئة في Angular:
   - `Frontend/mini-E-commerce/src/app/core/Services/environment.ts`
   - `Frontend/mini-E-commerce/src/app/core/Services/environment.prod.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  lookerStudioReportUrl: 'https://lookerstudio.google.com/embed/reporting/YOUR_REPORT_ID/page/YOUR_PAGE_ID'
};
```

---

## 🔒 أمان البيانات وتقسيم الـ Multi-Admin

> [!IMPORTANT]
> نظراً لأن **Looker Studio Free** لا يحتوي على Row-Level Security:
> - تم بناء **Backend Analytics API** داخل المشروع يقوم بحساب إحصائيات كل Admin بشكل منفصل وآمن (`req.user.id`).
> - كل Admin يرى في لوحته (`/admin/dashboard`) تحليلات منتجاته وأرباحه ومخزونه فقط.
> - زر **Google Looker Studio Hub** في لوحة التحكم يتيح عرض الـ Macro Dashboard الشامل للمنصة عند الحاجة.
