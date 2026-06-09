const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: "http://localhost:8080",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: false
}));
app.use(express.json());

// Global data storage
let orders = [];
let waiterCalls = [];
let menuItems = [
  // İçecekler
  { id: 1, name: 'Türk Kahvesi', price: 25, category: 'İçecekler', image: '/assets/images/turk-kahvesi.jpg', description: 'Geleneksel Türk kahvesi, lokumlu', available: true },
  { id: 2, name: 'Latte', price: 30, category: 'İçecekler', image: '/assets/images/latte.jpg', description: 'Sıcak süt ile hazırlanmış espresso', available: true },
  { id: 3, name: 'Çay', price: 16, category: 'İçecekler', image: '/assets/images/cay.jpg', description: 'Demli Türk çayı', available: true },
  { id: 4, name: 'Taze Portakal Suyu', price: 20, category: 'İçecekler', image: '/assets/images/portakal-suyu.jpg', description: 'Günlük sıkılmış portakal suyu', available: true },
  { id: 5, name: 'Limonata', price: 18, category: 'İçecekler', image: '/assets/images/limonata.jpg', description: 'Ev yapımı nane limonata', available: true },
  { id: 6, name: 'Soğuk Kahve', price: 28, category: 'İçecekler', image: '/assets/images/soguk-kahve.jpg', description: 'Buzlu americano kahve', available: true },
  
  // Yemekler
  { id: 7, name: 'Karışık Tost', price: 70, category: 'Yemekler', image: '/assets/images/karisik-tost.jpg', description: 'Kaşar, sucuk, domates ve marul ile', available: true },
  { id: 8, name: 'Hamburger', price: 85, category: 'Yemekler', image: '/assets/images/hamburger.jpg', description: 'Özel sos, et, sebze ve patates ile', available: true },
  { id: 9, name: 'Pizza Margherita', price: 120, category: 'Yemekler', image: '/assets/images/pizza.jpg', description: 'Domates sosu, mozzarella ve fesleğen', available: true },
  { id: 10, name: 'Makarna', price: 65, category: 'Yemekler', image: '/assets/images/makarna.jpg', description: 'Kremalı mantarlı makarna', available: true },
  { id: 11, name: 'Tavuk Salata', price: 55, category: 'Yemekler', image: '/assets/images/tavuk-salata.jpg', description: 'Izgara tavuk, yeşillik ve özel sos', available: true },
  { id: 12, name: 'Köfte', price: 75, category: 'Yemekler', image: '/assets/images/kofte.jpg', description: 'Ev yapımı köfte, pilav ve salata', available: true },
  
  // Tatlılar
  { id: 13, name: 'Tiramisu', price: 45, category: 'Tatlılar', image: '/assets/images/tiramisu.jpg', description: 'İtalyan tatlısı, kahve aromalı', available: true },
  { id: 14, name: 'Cheesecake', price: 40, category: 'Tatlılar', image: '/assets/images/cheesecake.jpg', description: 'Çilekli cheesecake', available: true },
  { id: 15, name: 'Sütlaç', price: 25, category: 'Tatlılar', image: '/assets/images/sutlac.jpg', description: 'Geleneksel sütlaç, tarçınlı', available: true },
  { id: 16, name: 'Baklava', price: 35, category: 'Tatlılar', image: '/assets/images/baklava.jpg', description: 'Antep fıstıklı baklava, 4 dilim', available: true },
  { id: 17, name: 'Profiterol', price: 38, category: 'Tatlılar', image: '/assets/images/profiterol.jpg', description: 'Çikolata soslu profiterol', available: true },
  { id: 18, name: 'Dondurma', price: 22, category: 'Tatlılar', image: '/assets/images/dondurma.jpg', description: 'Vanilyalı ev yapımı dondurma', available: true }
];

// MENÜ API'LERİ
// Menü listesi
app.get('/api/menu', (req, res) => {
  console.log('📋 Menü listesi istendi. Toplam ürün:', menuItems.length);
  res.json({ success: true, data: menuItems });
});

// Yeni ürün ekleme
app.post('/api/menu', (req, res) => {
  const newItem = {
    id: Date.now(),
    name: req.body.name,
    price: parseFloat(req.body.price),
    category: req.body.category,
    description: req.body.description || '',
    image: req.body.image || '/assets/images/default.jpg',
    available: req.body.available !== false
  };
  
  menuItems.push(newItem);
  console.log('➕ Yeni ürün eklendi:', newItem.name, '-', newItem.price, '₺');
  
  res.json({ 
    success: true, 
    data: newItem,
    message: 'Ürün başarıyla eklendi' 
  });
});

// Ürün güncelleme
app.put('/api/menu/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const itemIndex = menuItems.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Ürün bulunamadı' 
    });
  }
  
  menuItems[itemIndex] = {
    ...menuItems[itemIndex],
    name: req.body.name || menuItems[itemIndex].name,
    price: req.body.price !== undefined ? parseFloat(req.body.price) : menuItems[itemIndex].price,
    category: req.body.category || menuItems[itemIndex].category,
    description: req.body.description !== undefined ? req.body.description : menuItems[itemIndex].description,
    image: req.body.image || menuItems[itemIndex].image,
    available: req.body.available !== undefined ? req.body.available : menuItems[itemIndex].available
  };
  
  console.log('✏️ Ürün güncellendi:', menuItems[itemIndex].name);
  
  res.json({ 
    success: true, 
    data: menuItems[itemIndex],
    message: 'Ürün başarıyla güncellendi' 
  });
});

// Ürün silme
app.delete('/api/menu/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const itemIndex = menuItems.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Ürün bulunamadı' 
    });
  }
  
  const deletedItem = menuItems.splice(itemIndex, 1)[0];
  console.log('🗑️ Ürün silindi:', deletedItem.name);
  
  res.json({ 
    success: true, 
    data: deletedItem,
    message: 'Ürün başarıyla silindi' 
  });
});

// SİPARİŞ API'LERİ
// Sipariş listesi (Admin panel için)
app.get('/api/orders', (req, res) => {
  console.log('📋 Sipariş listesi istendi. Toplam sipariş:', orders.length);
  res.json({ 
    success: true, 
    data: orders 
  });
});

// Yeni sipariş oluşturma (Müşteri sayfası için)
app.post('/api/orders', (req, res) => {
  const order = {
    id: 'ORD' + Date.now(),
    tableNumber: req.body.tableNumber || 5,
    items: req.body.items || [],
    total: req.body.total || 0,
    notes: req.body.notes || '',
    customerNotes: req.body.customerNotes || '',
    status: 'pending',
    createdAt: new Date(),
    created_at: new Date().toISOString(),
    timestamp: req.body.timestamp || new Date().toISOString()
  };
  
  // Siparişi başa ekle (en yeni üstte)
  orders.unshift(order);
  
  console.log('📋 YENİ SİPARİŞ ALINDI:');
  console.log('├── Sipariş ID:', order.id);
  console.log('├── Masa:', order.tableNumber);
  console.log('├── Toplam:', order.total, '₺');
  console.log('├── Ürünler:', order.items.length, 'adet');
  if (order.notes) console.log('├── Sipariş Notu:', order.notes);
  if (order.customerNotes) console.log('├── Ürün Notları:', order.customerNotes);
  console.log('└── Zaman:', new Date(order.timestamp).toLocaleString('tr-TR'));
  
  res.json({ 
    success: true, 
    data: order, 
    id: order.id,
    message: 'Sipariş başarıyla alındı! Masa ' + order.tableNumber + ' için kayıt edildi.' 
  });
});

// Sipariş durumu güncelleme
app.put('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  
  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Sipariş bulunamadı' 
    });
  }
  
  orders[orderIndex].status = status;
  orders[orderIndex].updatedAt = new Date();
  
  console.log('📋 Sipariş durumu güncellendi:', orderId, '->', status);
  
  res.json({ 
    success: true, 
    data: orders[orderIndex],
    message: 'Sipariş durumu güncellendi' 
  });
});

// GARSON ÇAĞRISI API'LERİ
app.post('/api/waiter-calls', (req, res) => {
  const call = {
    id: 'CALL' + Date.now(),
    tableNumber: req.body.tableNumber,
    message: req.body.message || 'Garson çağrısı',
    status: 'pending',
    createdAt: new Date(),
    created_at: new Date().toISOString()
  };
  
  waiterCalls.unshift(call);
  console.log('📞 Garson çağrısı:', 'Masa', call.tableNumber, '-', call.message);
  
  res.json({ 
    success: true, 
    data: call, 
    message: 'Garson çağrısı alındı' 
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    orders: orders.length,
    menuItems: menuItems.length
  });
});

// Server başlatma
app.listen(PORT, () => {
  console.log('🚀 BACKEND SERVER BAŞLADI');
  console.log('├── Port:', PORT);
  console.log('├── Menü ürünleri:', menuItems.length);
  console.log('├── API Endpoints:');
  console.log('│   ├── GET  /api/menu');
  console.log('│   ├── POST /api/menu');
  console.log('│   ├── PUT  /api/menu/:id');
  console.log('│   ├── DELETE /api/menu/:id');
  console.log('│   ├── GET  /api/orders');
  console.log('│   ├── POST /api/orders');
  console.log('│   ├── PUT  /api/orders/:id');
  console.log('│   └── POST /api/waiter-calls');
  console.log('└── Frontend URL: http://localhost:8080');
});
