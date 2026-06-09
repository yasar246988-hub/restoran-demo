const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Veri dosyaları için klasör oluştur
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Veri dosyaları
const USERS_FILE = path.join(dataDir, 'users.json');
const EMPLOYEE_SHIFTS_FILE = path.join(dataDir, 'employee_shifts.json');
const EMPLOYEE_PERFORMANCE_FILE = path.join(dataDir, 'employee_performance.json');

// Veri yükleme fonksiyonları
const loadDataFromFile = (filePath, defaultValue = []) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`❌ ${filePath} dosyası okuma hatası:`, error);
  }
  return defaultValue;
};

const saveDataToFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ ${filePath} dosyasına veri kaydedildi`);
  } catch (error) {
    console.error(`❌ ${filePath} dosyasına yazma hatası:`, error);
  }
};

// Uploads klasörünü oluştur
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    // Dosya adını benzersiz yap
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Sadece resim dosyalarını kabul et
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir'), false);
    }
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:8080",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: false
}));
app.use(express.json({ limit: '10mb' })); // Büyük base64 resimleri için limit artırıldı

// Static dosya servisi - Yüklenen resimleri serve et
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Frontend build dosyalarını serve et
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  console.log('✅ Frontend dist klasörü serve ediliyor');
}

// Dosya yükleme endpoint'i
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenmedi'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    console.log('📤 Dosya yüklendi:', req.file.filename);

    res.json({
      success: true,
      data: {
        url: `http://localhost:3000${fileUrl}`,
        filename: req.file.filename,
        size: req.file.size
      },
      message: 'Dosya başarıyla yüklendi'
    });
  } catch (error) {
    console.error('❌ Dosya yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya yüklenirken hata oluştu'
    });
  }
});

// Global data storage
let orders = [];
let waiterCalls = [];
let activeSessions = {}; // QR kod oturumları
let tableTokens = {}; // Masa token'ları
let tableSplitPayments = {}; // Masa bazlı parçalı ödeme kayıtları

function clearTableSessions(tableNum) {
  const num = parseInt(tableNum);
  Object.keys(activeSessions).forEach(id => {
    if (activeSessions[id].tableId === num) delete activeSessions[id];
  });
  delete tableTokens[num];
  delete tableSplitPayments[num];
}

// MASA DURUMU TAKİBİ
// tableStatus[masaNo] = { status: 'occupied'|'available', openedAt, totalAmount }
let tableStatus = {};

// ARŞİVLENMİŞ SİPARİŞLER — Ödenen siparişler buraya taşınır, raporlarda görünür
const ARCHIVED_ORDERS_FILE = path.join(dataDir, 'archived_orders.json');
let archivedOrders = loadDataFromFile(ARCHIVED_ORDERS_FILE, []);

// ÇALIŞAN PERFORMANS TAKİBİ - Dosyadan yükle
let employeeShifts = loadDataFromFile(EMPLOYEE_SHIFTS_FILE, []); // Çalışan vardiya kayıtları
let employeePerformance = loadDataFromFile(EMPLOYEE_PERFORMANCE_FILE, []); // Çalışan performans kayıtları

// KAFE KONUM BİLGİSİ (CEO tarafından belirlenecek)
let cafeLocation = {
  latitude: 41.0082,  // İstanbul örnek koordinat
  longitude: 28.9784,
  radius: 200, // metre cinsinden izin verilen mesafe (GPS hassasiyet hatası için 200m)
  name: 'Kafe XYZ',
  address: 'İstanbul, Türkiye'
};

// QR MENÜ TEMA SİSTEMİ
const QR_MENU_THEMES_FILE = path.join(dataDir, 'qr_menu_theme.json');

// Tema ayarlarını dosyadan yükle
let qrMenuTheme = loadDataFromFile(QR_MENU_THEMES_FILE, {
  activeTheme: 'modern',
  customization: {
    cafeName: 'Kafe',
    cafeSlogan: 'Lezzetli anlar için buradayız',
    showPrices: true,
    showImages: true,
    enableSearch: true
  }
});

// Kullanıcıları dosyadan yükle
let users = loadDataFromFile(USERS_FILE, []);

// Eğer hiç kullanıcı yoksa varsayılan CEO hesabını oluştur
if (users.length === 0) {
  users = [
    {
      id: 1,
      username: 'ceo',
      password: 'ceo123', // Gerçek uygulamada hash'lenmiş olmalı
      role: 'ceo',
      name: 'CEO Admin',
      email: 'ceo@kafe.com',
      createdAt: new Date().toISOString(),
      isActive: true
    }
  ];
  saveDataToFile(USERS_FILE, users);
  console.log('✅ Varsayılan CEO hesabı oluşturuldu');
}
let menuItems = [
  // İçecekler
  { id: 1, name: 'Türk Kahvesi', price: 25, category: 'İçecekler', image: 'https://images.unsplash.com/photo-1578374173703-64851e4b350f?w=400&q=80', description: 'Geleneksel Türk kahvesi, lokumlu', available: true },
  { id: 2, name: 'Latte', price: 30, category: 'İçecekler', image: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=400&q=80', description: 'Sıcak süt ile hazırlanmış espresso', available: true },
  { id: 3, name: 'Çay', price: 16, category: 'İçecekler', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80', description: 'Demli Türk çayı', available: true },
  { id: 4, name: 'Taze Portakal Suyu', price: 20, category: 'İçecekler', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', description: 'Günlük sıkılmış portakal suyu', available: true },
  { id: 5, name: 'Limonata', price: 18, category: 'İçecekler', image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80', description: 'Ev yapımı nane limonata', available: true },
  { id: 6, name: 'Soğuk Kahve', price: 28, category: 'İçecekler', image: 'https://images.unsplash.com/photo-1517959105821-eaf2591984ca?w=400&q=80', description: 'Buzlu americano kahve', available: true },
  
  // Yemekler
  { id: 7, name: 'Karışık Tost', price: 70, category: 'Yemekler', image: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400&q=80', description: 'Kaşar, sucuk, domates ve marul ile', available: true },
  { id: 8, name: 'Hamburger', price: 85, category: 'Yemekler', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', description: 'Özel sos, et, sebze ve patates ile', available: true },
  { id: 9, name: 'Pizza Margherita', price: 120, category: 'Yemekler', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', description: 'Domates sosu, mozzarella ve fesleğen', available: true },
  { id: 10, name: 'Makarna', price: 65, category: 'Yemekler', image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80', description: 'Kremalı mantarlı makarna', available: true },
  { id: 11, name: 'Tavuk Salata', price: 55, category: 'Yemekler', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', description: 'Izgara tavuk, yeşillik ve özel sos', available: true },
  { id: 12, name: 'Köfte', price: 75, category: 'Yemekler', image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&q=80', description: 'Ev yapımı köfte, pilav ve salata', available: true },
  
  // Tatlılar
  { id: 13, name: 'Tiramisu', price: 45, category: 'Tatlılar', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80', description: 'İtalyan tatlısı, kahve aromalı', available: true },
  { id: 14, name: 'Cheesecake', price: 40, category: 'Tatlılar', image: 'https://images.unsplash.com/photo-1578775887804-699de7086ff9?w=400&q=80', description: 'Çilekli cheesecake', available: true },
  { id: 15, name: 'Sütlaç', price: 25, category: 'Tatlılar', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', description: 'Geleneksel sütlaç, tarçınlı', available: true },
  { id: 16, name: 'Baklava', price: 35, category: 'Tatlılar', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&q=80', description: 'Antep fıstıklı baklava, 4 dilim', available: true },
  { id: 17, name: 'Profiterol', price: 38, category: 'Tatlılar', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', description: 'Çikolata soslu profiterol', available: true },
  { id: 18, name: 'Dondurma', price: 22, category: 'Tatlılar', image: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=400&q=80', description: 'Vanilyalı ev yapımı dondurma', available: true }
];

// Konum mesafesi hesaplama fonksiyonu (Haversine formülü)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Dünya'nın yarıçapı (metre)
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c; // metre cinsinden mesafe
  return Math.round(distance);
}

// QR KOD GÜVENLİK API'LERİ

// Kafe konum bilgilerini getir
app.get('/api/cafe/location', (req, res) => {
  res.json({
    success: true,
    data: cafeLocation,
    message: 'Kafe konum bilgileri'
  });
});

// Kafe konum ayarları (Sadece CEO)
app.put('/api/cafe/location', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  
  if (!currentUser || currentUser.role !== 'ceo') {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için CEO yetkisi gerekli' 
    });
  }
  
  const { latitude, longitude, radius, name, address } = req.body;
  
  if (!latitude || !longitude) {
    return res.status(400).json({ 
      success: false, 
      message: 'Enlem ve boylam bilgileri gerekli' 
    });
  }
  
  cafeLocation = {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    radius: radius || 100,
    name: name || cafeLocation.name,
    address: address || cafeLocation.address
  };
  
  console.log('📍 Kafe konumu güncellendi:');
  console.log('├── Konum:', cafeLocation.latitude, ',', cafeLocation.longitude);
  console.log('├── Yarıçap:', cafeLocation.radius, 'metre');
  console.log('├── İsim:', cafeLocation.name);
  console.log('└── Adres:', cafeLocation.address);
  
  res.json({
    success: true,
    data: cafeLocation,
    message: 'Kafe konumu başarıyla güncellendi'
  });
});

// QR MENÜ TEMA API'LERİ

// QR Menü tema bilgilerini getir
app.get('/api/qr-menu/theme', (req, res) => {
  console.log('📡 QR Menü tema istendi:', qrMenuTheme.activeTheme);
  res.json({
    success: true,
    data: qrMenuTheme,
    message: 'QR Menü tema bilgileri'
  });
});

// QR Menü temasını güncelle (Sadece CEO/Yönetici)
app.put('/api/qr-menu/theme', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  
  if (!currentUser || !['ceo', 'yonetici'].includes(currentUser.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için yönetici yetkisi gerekli' 
    });
  }
  
  const { activeTheme, customization } = req.body;
  
  if (activeTheme) {
    const validThemes = ['modern', 'warm', 'fresh', 'elegant', 'vibrant', 'vintage', 'minimal'];
    if (!validThemes.includes(activeTheme)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz tema. Geçerli temalar: ' + validThemes.join(', ')
      });
    }
    qrMenuTheme.activeTheme = activeTheme;
  }
  
  // Layout seçimini kaydet
  const { selectedLayout } = req.body;
  if (selectedLayout) {
    const validLayouts = ['grid', 'list', 'masonry', 'horizontal'];
    if (!validLayouts.includes(selectedLayout)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz layout. Geçerli layoutlar: ' + validLayouts.join(', ')
      });
    }
    qrMenuTheme.selectedLayout = selectedLayout;
  }
  
  if (customization) {
    qrMenuTheme.customization = {
      ...qrMenuTheme.customization,
      ...customization
    };
  }
  
  saveDataToFile(QR_MENU_THEMES_FILE, qrMenuTheme);
  
  console.log('🎨 QR Menü teması güncellendi:');
  console.log('├── Tema:', qrMenuTheme.activeTheme);
  console.log('├── Layout:', qrMenuTheme.selectedLayout || 'grid');
  console.log('├── Kafe Adı:', qrMenuTheme.customization.cafeName);
  console.log('├── Slogan:', qrMenuTheme.customization.cafeSlogan);
  console.log('└── Logo:', qrMenuTheme.customization.logoUrl || 'Yok');
  
  addAuditLog('QR_MENU_TEMA', `QR Menü teması değiştirildi: ${qrMenuTheme.activeTheme} (Layout: ${qrMenuTheme.selectedLayout || 'grid'})`, req);
  
  res.json({
    success: true,
    data: qrMenuTheme,
    message: 'QR Menü teması başarıyla güncellendi'
  });
});

// QR Menü Logo Yükleme (Sadece CEO/Yönetici)
app.post('/api/qr-menu/upload-logo', upload.single('logo'), (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  
  if (!currentUser || !['ceo', 'yonetici'].includes(currentUser.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için yönetici yetkisi gerekli' 
    });
  }
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Logo dosyası yüklenmedi'
    });
  }
  
  // Logo URL'ini oluştur
  const logoUrl = '/uploads/' + req.file.filename;
  
  // QR Menü temasına logo ekle
  qrMenuTheme.customization = {
    ...qrMenuTheme.customization,
    logoUrl: logoUrl
  };
  
  saveDataToFile(QR_MENU_THEMES_FILE, qrMenuTheme);
  
  console.log('📷 QR Menü logosu yüklendi:', logoUrl);
  addAuditLog('QR_MENU_LOGO', `QR Menü logosu yüklendi: ${req.file.filename}`, req);
  
  res.json({
    success: true,
    data: {
      logoUrl: logoUrl,
      filename: req.file.filename
    },
    message: 'Logo başarıyla yüklendi'
  });
});

// QR Menü Logosu Silme (Sadece CEO/Yönetici)
app.delete('/api/qr-menu/delete-logo', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  
  if (!currentUser || !['ceo', 'yonetici'].includes(currentUser.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için yönetici yetkisi gerekli' 
    });
  }
  
  // Eski logoyu sil
  if (qrMenuTheme.customization?.logoUrl) {
    const oldLogoPath = path.join(__dirname, qrMenuTheme.customization.logoUrl);
    if (fs.existsSync(oldLogoPath)) {
      fs.unlinkSync(oldLogoPath);
      console.log('🗑️ Eski logo dosyası silindi:', oldLogoPath);
    }
  }
  
  // Logo URL'ini temizle
  qrMenuTheme.customization = {
    ...qrMenuTheme.customization,
    logoUrl: null
  };
  
  saveDataToFile(QR_MENU_THEMES_FILE, qrMenuTheme);
  
  console.log('🗑️ QR Menü logosu kaldırıldı');
  addAuditLog('QR_MENU_LOGO', 'QR Menü logosu kaldırıldı', req);
  
  res.json({
    success: true,
    message: 'Logo başarıyla kaldırıldı'
  });
});

// QR kod ile masa oturumu başlatma
app.post('/api/table/session', (req, res) => {
  const { tableId, location } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  
  if (!tableId) {
    return res.status(400).json({
      success: false,
      message: 'Masa ID gerekli'
    });
  }
  
  // DEMO: KONUM KONTROLÜ YOK - İsteğe bağlı
  console.log('📍 DEMO: Konum kontrolü devre dışı');
  if (location) {
    console.log('├── Konum alındı:', location.latitude, ',', location.longitude);
    console.log('└── Kontrol edilmiyor (demo mod)');
  }
  
  // Yeni session token oluştur
  const sessionToken = `table_${tableId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sessionId = `session_${Date.now()}`;
  
  // Session bilgilerini sakla
  activeSessions[sessionId] = {
    tableId: parseInt(tableId),
    token: sessionToken,
    clientIP: clientIP,
    location: location || null,
    distance: 0, // Demo'da mesafe kontrolü yok
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    isActive: true,
    orderCount: 0,
    maxOrdersPerSession: 10, // Demo'da 10 sipariş hakkı
    sessionDuration: 8 * 60 * 60 * 1000 // 8 saat
  };
  
  // Masa token'ını güncelle
  tableTokens[tableId] = {
    currentSession: sessionId,
    lastTokenIssued: sessionToken,
    lastActivity: new Date().toISOString()
  };
  
  console.log('🔐 DEMO: Yeni masa oturumu başlatıldı:');
  console.log('├── Masa:', tableId);
  console.log('├── Session ID:', sessionId);
  console.log('├── IP:', clientIP);
  console.log('├── Sipariş hakkı: 10');
  console.log('└── Güvenlik: ⚠️ Demo mod (konum kontrolsüz)');
  
  res.json({
    success: true,
    data: {
      sessionId: sessionId,
      token: sessionToken,
      tableId: parseInt(tableId),
      expiresAt: new Date(Date.now() + activeSessions[sessionId].sessionDuration).toISOString(),
      maxOrders: activeSessions[sessionId].maxOrdersPerSession
    },
    message: `Masa ${tableId} oturumu başlatıldı`
  });
});

// Session doğrulama
app.post('/api/table/validate', (req, res) => {
  const { sessionId, token } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  
  if (!sessionId || !token) {
    return res.status(400).json({
      success: false,
      message: 'Session ID ve token gerekli'
    });
  }
  
  const session = activeSessions[sessionId];
  
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz session'
    });
  }
  
  // Token kontrolü
  if (session.token !== token) {
    console.log('❌ Token uyumsuzluğu:', sessionId);
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }
  
  // Konum kontrolü - session'daki konum bilgisi ile kafe konumunu karşılaştır
  if (session.location) {
    const currentDistance = calculateDistance(
      cafeLocation.latitude,
      cafeLocation.longitude,
      session.location.latitude,
      session.location.longitude
    );
    
    if (currentDistance > cafeLocation.radius) {
      console.log('❌ Konum kontrolü başarısız:', sessionId);
      console.log('├── Session konumu:', session.location.latitude + ',' + session.location.longitude);
      console.log('├── Mevcut mesafe:', currentDistance, 'metre');
      console.log('└── İzin verilen mesafe:', cafeLocation.radius, 'metre');
      
      return res.status(403).json({
        success: false,
        message: 'Kafe konumu dışından sipariş veremezsiniz'
      });
    }
  }
  
  // Zaman kontrolü
  const sessionAge = Date.now() - new Date(session.startTime).getTime();
  if (sessionAge > session.sessionDuration) {
    delete activeSessions[sessionId];
    console.log('⏰ Session süresi doldu:', sessionId);
    return res.status(401).json({
      success: false,
      message: 'Oturum süresi doldu, QR kodu yeniden okutun'
    });
  }
  
  // Aktiflik kontrolü (30 dakika)
  const lastActivity = Date.now() - new Date(session.lastActivity).getTime();
  if (lastActivity > 30 * 60 * 1000) {
    delete activeSessions[sessionId];
    console.log('💤 Session pasif:', sessionId);
    return res.status(401).json({
      success: false,
      message: 'Uzun süre pasif kalındı, QR kodu yeniden okutun'
    });
  }
  
  // Session'ı güncelle
  session.lastActivity = new Date().toISOString();
  
  res.json({
    success: true,
    data: {
      tableId: session.tableId,
      remainingOrders: session.maxOrdersPerSession - session.orderCount,
      expiresAt: new Date(new Date(session.startTime).getTime() + session.sessionDuration).toISOString()
    },
    message: 'Session geçerli'
  });
});

// Session sonlandırma
app.post('/api/table/end-session', (req, res) => {
  const { sessionId } = req.body;
  
  if (activeSessions[sessionId]) {
    const session = activeSessions[sessionId];
    delete activeSessions[sessionId];
    
    console.log('🔚 Session sonlandırıldı:', sessionId, '- Masa:', session.tableId);
    
    res.json({
      success: true,
      message: 'Oturum sonlandırıldı'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Session bulunamadı'
    });
  }
});

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
  addAuditLog('MENU_GUNCELLEME', `Menü ürünü güncellendi: ${menuItems[itemIndex].name} (₺${menuItems[itemIndex].price})`, req);
  
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
  addAuditLog('MENU_SILME', `Menü ürünü silindi: ${deletedItem.name} (₺${deletedItem.price})`, req);
  
  res.json({ 
    success: true, 
    data: deletedItem,
    message: 'Ürün başarıyla silindi' 
  });
});

// KULLANICI YÖNETİMİ API'LERİ

// ============================================================
// YETKİ SİSTEMİ — Granular Permission Tanımları
// ============================================================

// Tüm mevcut yetkiler ve açıklamaları
const ALL_PERMISSIONS = [
  // Siparişler
  { key: 'orders.view',        label: 'Sipariş Takibi',       group: 'Siparişler',    icon: '📋' },
  { key: 'orders.complete',    label: 'Sipariş Tamamlama',    group: 'Siparişler',    icon: '✅' },
  { key: 'orders.transfer',    label: 'Masa Transferi',       group: 'Siparişler',    icon: '🔄' },
  // Masalar
  { key: 'tables.view',        label: 'Masa Görüntüleme',     group: 'Masalar',       icon: '🪑' },
  { key: 'tables.manage',      label: 'Masa Yönetimi',        group: 'Masalar',       icon: '🗂️' },
  { key: 'tables.map',         label: 'Masa Haritası',        group: 'Masalar',       icon: '🗺️' },
  // Mutfak
  { key: 'kitchen.view',       label: 'Mutfak Ekranı',        group: 'Mutfak',        icon: '🍳' },
  { key: 'kitchen.update',     label: 'Sipariş Durumu Değiştir', group: 'Mutfak',     icon: '🔥' },
  // Kasa
  { key: 'cashier.pos',        label: 'Kasa POS',             group: 'Kasa',          icon: '🧾' },
  { key: 'cashier.payment',    label: 'Ödeme Alma',           group: 'Kasa',          icon: '💳' },
  { key: 'cashier.register',   label: 'Kasa Açılış/Kapanış',  group: 'Kasa',          icon: '💰' },
  // Menü
  { key: 'menu.view',          label: 'Menü Görüntüleme',     group: 'Menü',          icon: '🍽️' },
  { key: 'menu.manage',        label: 'Menü Düzenleme',       group: 'Menü',          icon: '✏️' },
  // Garson
  { key: 'waiter.calls',       label: 'Garson Çağrıları',     group: 'Garson',        icon: '🔔' },
  // Raporlar
  { key: 'reports.view',       label: 'Raporlar',             group: 'Raporlar',      icon: '📊' },
  { key: 'reports.export',     label: 'Excel Export',         group: 'Raporlar',      icon: '📤' },
  // Çalışanlar
  { key: 'employees.view',     label: 'Çalışan Performansı',  group: 'Çalışanlar',    icon: '👥' },
  // Sistem
  { key: 'audit.view',         label: 'Denetim Günlüğü',     group: 'Sistem',        icon: '📋' },
  { key: 'settings.manage',    label: 'Sistem Ayarları',      group: 'Sistem',        icon: '⚙️' },
  { key: 'dashboard.view',     label: 'Dashboard',            group: 'Sistem',        icon: '📊' },
];

// Rol bazlı varsayılan yetkiler
function getDefaultPermissions(role) {
  switch (role) {
    case 'ceo':
      return ALL_PERMISSIONS.map(p => p.key); // Tüm yetkiler
    case 'yonetici':
      return [
        'orders.view', 'orders.complete', 'orders.transfer',
        'tables.view', 'tables.manage', 'tables.map',
        'kitchen.view', 'kitchen.update',
        'cashier.pos', 'cashier.payment', 'cashier.register',
        'menu.view', 'menu.manage',
        'waiter.calls',
        'employees.view',
        'dashboard.view'
      ];
    case 'calisan':
      return [
        'orders.view', 'orders.complete',
        'kitchen.view', 'kitchen.update',
        'cashier.pos',
        'waiter.calls',
      ];
    default:
      return ['orders.view', 'waiter.calls'];
  }
}

// Tüm yetki tanımlarını getir (frontend için)
app.get('/api/permissions', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  if (!currentUser || currentUser.role !== 'ceo') {
    return res.status(403).json({ success: false, message: 'CEO yetkisi gerekli' });
  }
  res.json({ success: true, data: ALL_PERMISSIONS });
});

// Mevcut kullanıcının yetkilerini getir (login sonrası)
app.get('/api/auth/permissions', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı' });
  const perms = user.permissions || getDefaultPermissions(user.role);
  res.json({ success: true, data: perms });
});


// Giriş yapma (Login)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('🔐 Giriş denemesi:', username);
  
  // Email veya username ile giriş yapabilme
  const user = users.find(u => 
    (u.username === username || u.email === username) && 
    u.password === password && 
    u.isActive
  );
  
  if (!user) {
    console.log('❌ Giriş başarısız:', username);
    return res.status(401).json({ 
      success: false, 
      message: 'Email/kullanıcı adı veya şifre hatalı' 
    });
  }
  
  // Şifreyi response'dan çıkar
  const { password: _, ...userInfo } = user;
  
  console.log('✅ Giriş başarılı:', user.name, '- Role:', user.role);

  // Denetim kaydı
  addAuditLog('GIRIS', `${user.name} (${user.role}) sisteme giriş yaptı`, req);
  
  res.json({ 
    success: true, 
    data: {
      user: userInfo,
      token: `token_${user.id}_${Date.now()}` // Basit token
    },
    message: 'Giriş başarılı' 
  });
});

// Kullanıcı bilgilerini getir
app.get('/api/auth/user', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Kullanıcı bulunamadı' 
    });
  }
  
  const { password: _, ...userInfo } = user;
  
  res.json({ 
    success: true, 
    data: userInfo,
    message: 'Kullanıcı bilgileri' 
  });
});

// ÇALIŞAN PERFORMANS TAKİBİ API'LERİ

// Vardiya başlatma
app.post('/api/employee/shift/start', (req, res) => {
  const { employeeId, employeeName } = req.body;
  
  if (!employeeId || !employeeName) {
    return res.status(400).json({
      success: false,
      message: 'Çalışan ID ve ismi gerekli'
    });
  }
  
  // Aktif vardiya var mı kontrol et
  const activeShift = employeeShifts.find(shift => 
    shift.employeeId === employeeId && shift.endTime === null
  );
  
  if (activeShift) {
    return res.status(400).json({
      success: false,
      message: 'Zaten aktif bir vardiyanız var'
    });
  }
  
  const newShift = {
    id: 'SHIFT' + Date.now(),
    employeeId: employeeId,
    employeeName: employeeName,
    startTime: new Date().toISOString(),
    endTime: null,
    totalOrders: 0,
    totalWaiterCalls: 0,
    totalRevenue: 0,
    averageOrderTime: 0
  };
  
  employeeShifts.push(newShift);
  
  console.log('🕐 Vardiya başlatıldı:', employeeName, '- ID:', newShift.id);
  
  res.json({
    success: true,
    data: newShift,
    message: 'Vardiya başlatıldı'
  });
});

// Vardiya bitirme
app.post('/api/employee/shift/end', (req, res) => {
  const { employeeId } = req.body;
  
  const activeShift = employeeShifts.find(shift => 
    shift.employeeId === employeeId && shift.endTime === null
  );
  
  if (!activeShift) {
    return res.status(400).json({
      success: false,
      message: 'Aktif vardiya bulunamadı'
    });
  }
  
  activeShift.endTime = new Date().toISOString();
  activeShift.duration = Math.round((new Date(activeShift.endTime) - new Date(activeShift.startTime)) / 1000 / 60); // dakika
  
  console.log('🕐 Vardiya bitirildi:', activeShift.employeeName, '- Süre:', activeShift.duration, 'dakika');
  
  res.json({
    success: true,
    data: activeShift,
    message: 'Vardiya bitirildi'
  });
});

// Çalışan performans raporu
app.get('/api/employee/performance/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  const { startDate, endDate } = req.query;
  
  let filteredShifts = employeeShifts.filter(shift => shift.employeeId === employeeId);
  
  // Tarih filtresi
  if (startDate && endDate) {
    filteredShifts = filteredShifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate >= new Date(startDate) && shiftDate <= new Date(endDate);
    });
  }
  
  // Performans hesaplamaları
  const totalShifts = filteredShifts.length;
  const completedShifts = filteredShifts.filter(shift => shift.endTime !== null).length;
  const totalWorkHours = filteredShifts.reduce((sum, shift) => sum + (shift.duration || 0), 0);
  const totalOrders = filteredShifts.reduce((sum, shift) => sum + shift.totalOrders, 0);
  const totalWaiterCalls = filteredShifts.reduce((sum, shift) => sum + shift.totalWaiterCalls, 0);
  const totalRevenue = filteredShifts.reduce((sum, shift) => sum + shift.totalRevenue, 0);
  
  const performance = {
    employeeId: employeeId,
    totalShifts: totalShifts,
    completedShifts: completedShifts,
    totalWorkHours: totalWorkHours,
    totalOrders: totalOrders,
    totalWaiterCalls: totalWaiterCalls,
    totalRevenue: totalRevenue,
    averageOrdersPerShift: totalShifts > 0 ? (totalOrders / totalShifts).toFixed(1) : 0,
    averageRevenuePerShift: totalShifts > 0 ? (totalRevenue / totalShifts).toFixed(2) : 0,
    shifts: filteredShifts
  };
  
  res.json({
    success: true,
    data: performance,
    message: 'Çalışan performans raporu'
  });
});

// Günlük çalışan performans raporu
app.get('/api/employee/performance/daily/:date', (req, res) => {
  const { date } = req.params;
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const dailyShifts = employeeShifts.filter(shift => {
    const shiftDate = new Date(shift.startTime);
    return shiftDate >= startOfDay && shiftDate <= endOfDay;
  });
  
  // Çalışan bazında grupla
  const employeeStats = {};
  
  dailyShifts.forEach(shift => {
    if (!employeeStats[shift.employeeId]) {
      employeeStats[shift.employeeId] = {
        employeeId: shift.employeeId,
        employeeName: shift.employeeName,
        totalShifts: 0,
        totalWorkHours: 0,
        totalOrders: 0,
        totalWaiterCalls: 0,
        totalRevenue: 0,
        averageOrderTime: 0
      };
    }
    
    employeeStats[shift.employeeId].totalShifts++;
    employeeStats[shift.employeeId].totalWorkHours += shift.duration || 0;
    employeeStats[shift.employeeId].totalOrders += shift.totalOrders;
    employeeStats[shift.employeeId].totalWaiterCalls += shift.totalWaiterCalls;
    employeeStats[shift.employeeId].totalRevenue += shift.totalRevenue;
  });
  
  const dailyReport = {
    date: date,
    totalEmployees: Object.keys(employeeStats).length,
    totalWorkHours: Object.values(employeeStats).reduce((sum, emp) => sum + emp.totalWorkHours, 0),
    totalOrders: Object.values(employeeStats).reduce((sum, emp) => sum + emp.totalOrders, 0),
    totalWaiterCalls: Object.values(employeeStats).reduce((sum, emp) => sum + emp.totalWaiterCalls, 0),
    totalRevenue: Object.values(employeeStats).reduce((sum, emp) => sum + emp.totalRevenue, 0),
    employees: Object.values(employeeStats)
  };
  
  res.json({
    success: true,
    data: dailyReport,
    message: 'Günlük çalışan performans raporu'
  });
});

// Tüm çalışanların performans raporu
app.get('/api/employee/performance', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredShifts = [...employeeShifts];
  
  // Tarih filtresi
  if (startDate && endDate) {
    filteredShifts = filteredShifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate >= new Date(startDate) && shiftDate <= new Date(endDate);
    });
  }
  
  // Çalışan bazında grupla
  const employeeStats = {};
  
  filteredShifts.forEach(shift => {
    if (!employeeStats[shift.employeeId]) {
      employeeStats[shift.employeeId] = {
        employeeId: shift.employeeId,
        employeeName: shift.employeeName,
        totalShifts: 0,
        totalWorkHours: 0,
        totalOrders: 0,
        totalWaiterCalls: 0,
        totalRevenue: 0,
        averageOrderTime: 0
      };
    }
    
    employeeStats[shift.employeeId].totalShifts++;
    employeeStats[shift.employeeId].totalWorkHours += shift.duration || 0;
    employeeStats[shift.employeeId].totalOrders += shift.totalOrders;
    employeeStats[shift.employeeId].totalWaiterCalls += shift.totalWaiterCalls;
    employeeStats[shift.employeeId].totalRevenue += shift.totalRevenue;
  });
  
  // Ortalama hesaplamaları
  Object.values(employeeStats).forEach(emp => {
    emp.averageOrdersPerShift = emp.totalShifts > 0 ? (emp.totalOrders / emp.totalShifts).toFixed(1) : 0;
    emp.averageRevenuePerShift = emp.totalShifts > 0 ? (emp.totalRevenue / emp.totalShifts).toFixed(2) : 0;
    emp.averageWorkHoursPerShift = emp.totalShifts > 0 ? (emp.totalWorkHours / emp.totalShifts).toFixed(1) : 0;
  });
  
  const allEmployeesReport = {
    totalEmployees: Object.keys(employeeStats).length,
    totalWorkHours: Object.values(employeeStats).reduce((sum, emp) => sum + emp.totalWorkHours, 0),
    totalOrders: Object.values(employeeStats).reduce((sum, emp) => sum + emp.totalOrders, 0),
    totalWaiterCalls: Object.values(employeeStats).reduce((sum, emp) => sum + emp.totalWaiterCalls, 0),
    totalRevenue: Object.values(employeeStats).reduce((sum, emp) => sum + emp.totalRevenue, 0),
    employees: Object.values(employeeStats).sort((a, b) => b.totalOrders - a.totalOrders)
  };
  
  res.json({
    success: true,
    data: allEmployeesReport,
    message: 'Tüm çalışanların performans raporu'
  });
});

// Kullanıcı listesi (Sadece CEO)
app.get('/api/users', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  
  if (!currentUser || currentUser.role !== 'ceo') {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için CEO yetkisi gerekli' 
    });
  }
  
  const userList = users.map(({ password, ...user }) => user);
  
  console.log('👥 Kullanıcı listesi istendi. Toplam:', users.length);
  
  res.json({ 
    success: true, 
    data: userList 
  });
});

// Yeni kullanıcı oluşturma (Sadece CEO)
app.post('/api/users', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  
  if (!currentUser || currentUser.role !== 'ceo') {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için CEO yetkisi gerekli' 
    });
  }
  
  const { username, password, role, name, email, permissions } = req.body;
  
  // Kullanıcı adı kontrolü
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Bu kullanıcı adı zaten mevcut' 
    });
  }
  
  // Yeni kullanıcı oluştur
  const newUser = {
    id: users.length + 1,
    username,
    password,
    role,
    name,
    email,
    // permissions: CEO tarafından seçilen yetkiler array'i
    // Boşsa rol bazlı varsayılan yetkiler atanır
    permissions: Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : getDefaultPermissions(role),
    createdAt: new Date().toISOString(),
    isActive: true
  };
  
  users.push(newUser);
  saveDataToFile(USERS_FILE, users);
  
  console.log('👤 Yeni kullanıcı oluşturuldu:', newUser.name, '- Role:', newUser.role, '- Yetkiler:', newUser.permissions.length);
  
  const { password: _, ...userInfo } = newUser;
  
  res.json({ 
    success: true, 
    data: userInfo,
    message: 'Kullanıcı başarıyla oluşturuldu' 
  });
  addAuditLog('KULLANICI_OLUSTURMA', `Yeni kullanıcı oluşturuldu: ${newUser.name} (${newUser.role}) - ${newUser.permissions.length} yetki`, req);
});

// Kullanıcı güncelleme (Sadece CEO)
app.put('/api/users/:id', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  
  if (!currentUser || currentUser.role !== 'ceo') {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için CEO yetkisi gerekli' 
    });
  }
  
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
  
  if (userIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Kullanıcı bulunamadı' 
    });
  }
  
  const { name, email, role, isActive, permissions } = req.body;
  
  users[userIndex] = {
    ...users[userIndex],
    name: name || users[userIndex].name,
    email: email || users[userIndex].email,
    role: role || users[userIndex].role,
    isActive: isActive !== undefined ? isActive : users[userIndex].isActive,
    // Permissions güncellendi ise yeni set, yoksa eskisi
    permissions: Array.isArray(permissions) ? permissions : users[userIndex].permissions || getDefaultPermissions(users[userIndex].role),
    updatedAt: new Date().toISOString()
  };
  
  // Kullanıcıları dosyaya kaydet
  saveDataToFile(USERS_FILE, users);
  
  console.log('📝 Kullanıcı güncellendi:', users[userIndex].name);
  
  const { password: _, ...userInfo } = users[userIndex];
  
  res.json({ 
    success: true, 
    data: userInfo,
    message: 'Kullanıcı başarıyla güncellendi' 
  });
});

// Kullanıcı silme (Sadece CEO)
app.delete('/api/users/:id', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  
  if (!currentUser || currentUser.role !== 'ceo') {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için CEO yetkisi gerekli' 
    });
  }
  
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
  
  if (userIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Kullanıcı bulunamadı' 
    });
  }
  
  // CEO kendini silemez
  if (users[userIndex].role === 'ceo') {
    return res.status(400).json({ 
      success: false, 
      message: 'CEO hesabı silinemez' 
    });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  
  // Kullanıcıları dosyaya kaydet
  saveDataToFile(USERS_FILE, users);
  
  console.log('🗑️ Kullanıcı silindi:', deletedUser.name);
  
  const { password: _, ...userInfo } = deletedUser;
  
  res.json({ 
    success: true, 
    data: userInfo,
    message: 'Kullanıcı başarıyla silindi' 
  });
});

// SİPARİŞ API'LERİ
// Sipariş listesi (Admin panel için)
app.get('/api/orders', (req, res) => {
  console.log('📋 Sipariş listesi istendi. Toplam sipariş:', orders.length);
  
  // Her siparişin masa numarasını kontrol et
  orders.forEach((order, index) => {
    console.log(`📋 Sipariş ${index + 1}: ID=${order.id}, Masa=${order.tableNumber}, Durum=${order.status}`)
  })
  
  res.json({ 
    success: true, 
    data: orders 
  });
});

// Yeni sipariş oluşturma (Müşteri sayfası için) - Güvenlik kontrolü ile
app.post('/api/orders', (req, res) => {
  const { sessionId, token, tableNumber, items, total, notes, customerNotes, currentLocation } = req.body;
  
  console.log('📥 GELEN SİPARİŞ VERİSİ:')
  console.log('├── tableNumber:', tableNumber, '(tip:', typeof tableNumber, ')')
  console.log('├── items:', items?.length || 0, 'adet')
  console.log('├── total:', total, '₺')
  console.log('├── sessionId:', sessionId)
  console.log('├── currentLocation:', currentLocation ? 'var' : 'yok')
  console.log('└── Tam request body:', req.body)
  
  // Müşteri siparişleri için QR session zorunlu
  if (!sessionId || !token) {
    return res.status(401).json({
      success: false,
      message: 'Sipariş vermek için masadaki QR kodu okutmanız gerekiyor.'
    });
  }

  if (sessionId && token) {
    const session = activeSessions[sessionId];
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz session. QR kodu yeniden okutun.'
      });
    }
    
    // Token kontrolü
    if (session.token !== token) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token'
      });
    }
    
    // Session süre kontrolü
    const sessionAge = Date.now() - new Date(session.startTime).getTime();
    if (sessionAge > session.sessionDuration) {
      delete activeSessions[sessionId];
      return res.status(401).json({
        success: false,
        message: 'Oturum süresi doldu'
      });
    }
    
    // Sipariş limit kontrolü
    if (session.orderCount >= session.maxOrdersPerSession) {
      return res.status(429).json({
        success: false,
        message: 'Maksimum sipariş limitine ulaşıldı'
      });
    }
    
    // DEMO: KONUM KONTROLÜ YOK - İsteğe bağlı
    console.log('📍 DEMO: Sipariş konum kontrolü devre dışı');
    if (currentLocation) {
      console.log('├── Güncel konum alındı:', currentLocation.latitude, ',', currentLocation.longitude);
      console.log('└── Kontrol edilmiyor (demo mod)');
      // Session konum bilgisini güncelle
      session.location = currentLocation;
      session.lastDistance = 0;
    }
    
    // Masa numarası session ile eşleşmeli
    if (parseInt(session.tableId) !== parseInt(tableNumber)) {
      return res.status(403).json({
        success: false,
        message: 'Session masa numarası ile uyuşmuyor. QR kodu tekrar okutun.'
      });
    }

    session.orderCount += 1;
    session.lastActivity = new Date().toISOString();
    console.log('🔒 DEMO: Güvenlik kontrolü geçti - Session:', sessionId, 'Sipariş:', session.orderCount);
  }
  
  const order = {
    id: 'ORD' + Date.now(),
    tableNumber: tableNumber,
    items: items || [],
    total: total || 0,
    notes: notes || '',
    customerNotes: customerNotes || '',
    status: 'pending',
    createdAt: new Date(),
    created_at: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    sessionId: sessionId || null, // Session bilgisini kaydet
    securityChecked: !!sessionId // Güvenlik kontrolü yapıldı mı?
  };
  
  console.log('📝 OLUŞTURULAN SİPARİŞ:')
  console.log('├── tableNumber:', order.tableNumber, '(tip:', typeof order.tableNumber, ')')
  console.log('├── id:', order.id)
  console.log('└── Tam sipariş objesi:', order)
  
  // Siparişi başa ekle (en yeni üstte)
  orders.unshift(order);

  // Masa durumunu "dolu" yap
  const tNum = parseInt(order.tableNumber || order.tableId);
  if (tNum) {
    if (!tableStatus[tNum]) {
      tableStatus[tNum] = { status: 'occupied', openedAt: order.createdAt || new Date().toISOString(), totalAmount: 0 };
    }
    tableStatus[tNum].status = 'occupied';
    tableStatus[tNum].totalAmount = (tableStatus[tNum].totalAmount || 0) + parseFloat(order.total || 0);
  }

  // 🔌 SOCKET — Anlık yayın (tüm bağlı ekranlar anında güncellenir)
  emitNewOrder(order);

  // 🍳 MUTFAK YAZICISI — Otomatik tetikle (async, siparişi engellemez)
  printKitchenOrder(order).catch(err => {
    console.error('⚠️ Mutfak yazıcısı hatası:', err.message);
  });
  
  console.log('📋 YENİ SİPARİŞ ALINDI:');
  console.log('├── Sipariş ID:', order.id);
  console.log('├── Masa:', order.tableNumber);
  console.log('├── Toplam:', order.total, '₺');
  console.log('├── Ürünler:', order.items.length, 'adet');
  console.log('├── Güvenlik:', order.securityChecked ? '✅ Kontrollü' : '⚠️ Kontrolsuz');
  if (order.notes) console.log('├── Sipariş Notu:', order.notes);
  if (order.customerNotes) console.log('├── Ürün Notları:', order.customerNotes);
  console.log('└── Zaman:', new Date(order.timestamp).toLocaleString('tr-TR'));

  // Tek kullanımlık session — sipariş sonrası geçersiz kıl (yeni sipariş için QR tekrar okutulmalı)
  if (sessionId && activeSessions[sessionId]) {
    delete activeSessions[sessionId];
    console.log('🔐 Session sonlandırıldı (tek sipariş):', sessionId);
  }
  
  res.json({ 
    success: true, 
    data: order, 
    id: order.id,
    message: 'Sipariş başarıyla alındı! Masa ' + order.tableNumber + ' için kayıt edildi.' 
  });
});

// ============================================================
// KASA RAPORU & GÜNLÜK KAPANIŞ
// ============================================================

// Ödeme al — siparişi kapat ve ödeme yöntemini kaydet
app.post('/api/orders/:id/payment', (req, res) => {
  const { id } = req.params;
  const { paymentMethod, discount, notes } = req.body;
  // paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed'

  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });

  const order = orders[idx];
  const discountAmount = parseFloat(discount || 0);
  const finalTotal = Math.max(0, parseFloat(order.total || 0) - discountAmount);

  orders[idx] = {
    ...order,
    status: 'completed',
    paymentMethod: paymentMethod || 'cash',
    discount: discountAmount,
    finalTotal: finalTotal,
    paidAt: new Date().toISOString(),
    paymentNotes: notes || ''
  };

  console.log(`💳 Ödeme alındı: Masa ${order.tableNumber} | ${paymentMethod} | ₺${finalTotal}`);
  addAuditLog('ODEME', `Masa ${order.tableNumber} — ₺${finalTotal.toFixed(2)} (${paymentMethod})${discountAmount > 0 ? ` İndirim: ₺${discountAmount}` : ''}`, req);

  res.json({
    success: true,
    data: orders[idx],
    message: `Ödeme alındı — ₺${finalTotal.toFixed(2)} (${paymentMethod})`
  });
});

// Günlük kasa raporu
app.get('/api/reports/daily', (req, res) => {
  const dateStr = req.query.date || new Date().toISOString().split('T')[0];
  const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
  const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

  // Hem aktif hem arşivlenmiş siparişleri birleştir — arşivlenmiş ödendi demek
  const allOrders = [...orders, ...archivedOrders];

  const dayOrders = allOrders.filter(o => {
    const d = new Date(o.paidAt || o.archivedAt || o.createdAt || o.created_at || o.timestamp);
    return d >= startOfDay && d <= endOfDay;
  });

  const completedOrders = dayOrders.filter(o => o.status === 'completed');

  // Ödeme yöntemi dağılımı
  const paymentBreakdown = { cash: 0, card: 0, transfer: 0, mixed: 0, split: 0, other: 0 };
  completedOrders.forEach(o => {
    const method = o.paymentMethod || 'cash';
    const key = paymentBreakdown.hasOwnProperty(method) ? method : 'other';
    paymentBreakdown[key] = (paymentBreakdown[key] || 0) + parseFloat(o.finalTotal || o.total || 0);
  });

  // Saat bazlı dağılım
  const hourlyData = Array(24).fill(0).map((_, h) => ({
    hour: h,
    label: `${String(h).padStart(2, '0')}:00`,
    orders: 0,
    revenue: 0
  }));
  completedOrders.forEach(o => {
    const h = new Date(o.paidAt || o.archivedAt || o.createdAt || o.timestamp).getHours();
    hourlyData[h].orders++;
    hourlyData[h].revenue += parseFloat(o.finalTotal || o.total || 0);
  });

  // En çok satan ürünler
  const productSales = {};
  completedOrders.forEach(o => {
    (o.items || []).forEach(item => {
      if (!productSales[item.name]) productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      productSales[item.name].quantity += parseInt(item.quantity || 1);
      productSales[item.name].revenue += parseFloat(item.price || 0) * parseInt(item.quantity || 1);
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  // Masa bazlı ciro
  const tableSales = {};
  completedOrders.forEach(o => {
    const t = o.tableNumber || o.tableId || '?';
    if (!tableSales[t]) tableSales[t] = { table: t, orders: 0, revenue: 0 };
    tableSales[t].orders++;
    tableSales[t].revenue += parseFloat(o.finalTotal || o.total || 0);
  });

  const totalRevenue = completedOrders.reduce((s, o) => s + parseFloat(o.finalTotal || o.total || 0), 0);
  const totalDiscount = completedOrders.reduce((s, o) => s + parseFloat(o.discount || 0), 0);
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Kategori bazlı satışlar
  const categorySales = {};
  completedOrders.forEach(o => {
    (o.items || []).forEach(item => {
      const cat = item.category || 'Diğer';
      if (!categorySales[cat]) categorySales[cat] = { category: cat, quantity: 0, revenue: 0 };
      categorySales[cat].quantity += parseInt(item.quantity || 1);
      categorySales[cat].revenue += parseFloat(item.price || 0) * parseInt(item.quantity || 1);
    });
  });

  res.json({
    success: true,
    data: {
      date: dateStr,
      summary: {
        totalOrders: completedOrders.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalDiscount: parseFloat(totalDiscount.toFixed(2)),
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        activeOrders: orders.filter(o => o.status !== 'completed').length
      },
      paymentBreakdown,
      hourlyData: hourlyData.filter(h => h.orders > 0),
      topProducts,
      tableSales: Object.values(tableSales).sort((a, b) => b.revenue - a.revenue),
      categorySales: Object.values(categorySales).sort((a, b) => b.revenue - a.revenue)
    }
  });
});

// Tarih aralığı raporu (haftalık/aylık/özel)
app.get('/api/reports/range', (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'startDate ve endDate gerekli' });
  }

  const start = new Date(startDate + 'T00:00:00.000Z');
  const end = new Date(endDate + 'T23:59:59.999Z');

  const allOrders = [...orders, ...archivedOrders];
  const rangeOrders = allOrders.filter(o => {
    const d = new Date(o.paidAt || o.archivedAt || o.createdAt || o.created_at || o.timestamp);
    return d >= start && d <= end && o.status === 'completed';
  });

  // Gün bazlı özet
  const dailySummary = {};
  rangeOrders.forEach(o => {
    const day = new Date(o.paidAt || o.archivedAt || o.createdAt || o.timestamp).toISOString().split('T')[0];
    if (!dailySummary[day]) dailySummary[day] = { date: day, orders: 0, revenue: 0 };
    dailySummary[day].orders++;
    dailySummary[day].revenue += parseFloat(o.finalTotal || o.total || 0);
  });

  const totalRevenue = rangeOrders.reduce((s, o) => s + parseFloat(o.finalTotal || o.total || 0), 0);

  // En çok satanlar
  const productSales = {};
  rangeOrders.forEach(o => {
    (o.items || []).forEach(item => {
      if (!productSales[item.name]) productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      productSales[item.name].quantity += parseInt(item.quantity || 1);
      productSales[item.name].revenue += parseFloat(item.price || 0) * parseInt(item.quantity || 1);
    });
  });

  res.json({
    success: true,
    data: {
      startDate,
      endDate,
      totalOrders: rangeOrders.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      avgOrderValue: rangeOrders.length > 0 ? parseFloat((totalRevenue / rangeOrders.length).toFixed(2)) : 0,
      dailySummary: Object.values(dailySummary).sort((a, b) => a.date.localeCompare(b.date)),
      topProducts: Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 10)
    }
  });
});

// Dashboard özet endpoint
app.get('/api/dashboard/summary', (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const allOrders = [...orders, ...archivedOrders];

  // Bugünkü tamamlanan siparişler (arşiv + aktif)
  const todayCompleted = allOrders.filter(o => {
    if (o.status !== 'completed') return false;
    const d = new Date(o.paidAt || o.archivedAt || o.createdAt || o.timestamp);
    return d >= startOfDay && d <= endOfDay;
  });

  // Aktif siparişler (ödenmemiş)
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

  // Aktif masalar
  const activeTables = [...new Set(
    activeOrders.map(o => parseInt(o.tableNumber || o.tableId)).filter(n => !isNaN(n))
  )];

  // Mutfakta bekleyen/hazırlanan siparişler
  const kitchenOrders = activeOrders.filter(o => o.status === 'pending' || o.status === 'preparing');

  // Günlük ciro
  const dailyRevenue = todayCompleted.reduce((s, o) => s + parseFloat(o.finalTotal || o.total || 0), 0);

  // Bekleyen garson çağrıları
  const pendingWaiterCalls = waiterCalls.filter(c => c.status === 'pending').length;

  res.json({
    success: true,
    data: {
      todayOrders: todayCompleted.length,
      activeTables: activeTables.length,
      totalTables: 20,
      dailyRevenue: parseFloat(dailyRevenue.toFixed(2)),
      kitchenOrders: kitchenOrders.length,
      activeOrders: activeOrders.length,
      pendingWaiterCalls,
      recentOrders: activeOrders.slice(0, 5).map(o => ({
        id: o.id,
        tableNumber: o.tableNumber || o.tableId,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt || o.timestamp
      }))
    }
  });
});



// Masa durumu özeti (harita için)
app.get('/api/tables/status', (req, res) => {
  // Aktif siparişlerden masa durumlarını hesapla
  const tableStatusMap = {};

  orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').forEach(o => {
    const t = o.tableNumber || o.tableId;
    if (!t) return;
    if (!tableStatusMap[t]) {
      tableStatusMap[t] = {
        tableNumber: parseInt(t),
        status: 'occupied',
        orders: [],
        totalAmount: 0,
        openedAt: o.createdAt || o.timestamp
      };
    }
    tableStatusMap[t].orders.push(o.id);
    tableStatusMap[t].totalAmount += parseFloat(o.total || 0);
    // En eski sipariş zamanını al
    const orderTime = new Date(o.createdAt || o.timestamp);
    const currentOpen = new Date(tableStatusMap[t].openedAt);
    if (orderTime < currentOpen) tableStatusMap[t].openedAt = o.createdAt || o.timestamp;
  });

  res.json({ success: true, data: tableStatusMap });
});

// ============================================================
// MASA DEĞİŞTİRME — Aktif siparişleri bir masadan diğerine taşı
// ============================================================
app.post('/api/orders/transfer-table', (req, res) => {
  const { fromTable, toTable } = req.body;

  if (!fromTable || !toTable) {
    return res.status(400).json({ success: false, message: 'Kaynak ve hedef masa numarası gerekli' });
  }

  if (parseInt(fromTable) === parseInt(toTable)) {
    return res.status(400).json({ success: false, message: 'Kaynak ve hedef masa aynı olamaz' });
  }

  // Kaynak masanın aktif siparişlerini bul
  const activeOrders = orders.filter(o =>
    (o.tableNumber === parseInt(fromTable) || o.tableNumber === String(fromTable)) &&
    o.status !== 'completed' && o.status !== 'cancelled'
  );

  if (activeOrders.length === 0) {
    return res.status(404).json({ success: false, message: `Masa ${fromTable}'de aktif sipariş bulunamadı` });
  }

  const transferTime = new Date().toISOString();
  const transferredIds = [];

  // Tüm aktif siparişleri yeni masaya taşı
  activeOrders.forEach(order => {
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx !== -1) {
      // Önceki masa bilgisini geçmişe kaydet
      if (!orders[idx].tableHistory) orders[idx].tableHistory = [];
      orders[idx].tableHistory.push({
        fromTable: orders[idx].tableNumber,
        toTable: parseInt(toTable),
        transferredAt: transferTime
      });

      // Masayı güncelle
      orders[idx].tableNumber = parseInt(toTable);
      orders[idx].tableId = parseInt(toTable);
      orders[idx].transferredFrom = parseInt(fromTable);
      orders[idx].lastTransferAt = transferTime;

      transferredIds.push(orders[idx].id);
    }
  });

  console.log(`🔄 Masa transferi: ${fromTable} → ${toTable} | ${transferredIds.length} sipariş taşındı`);
  addAuditLog('MASA_TRANSFER', `Masa ${fromTable} → Masa ${toTable} | ${transferredIds.length} sipariş taşındı`, req);

  res.json({
    success: true,
    message: `Masa ${fromTable}'deki ${transferredIds.length} sipariş, Masa ${toTable}'ye taşındı`,
    data: {
      fromTable: parseInt(fromTable),
      toTable: parseInt(toTable),
      transferredOrders: transferredIds,
      transferredAt: transferTime
    }
  });
});

// ============================================================
// MASA BAZLI ADİSYON + HESAP ÖDEME + MASA SIFIRLAMA
// (Tek ve güncel versiyon — eski duplicate kaldırıldı)
// ============================================================

// Sipariş durumu güncelleme
app.put('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  const { status, completed_at, duration, employeeId, employeeName } = req.body;
  
  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Sipariş bulunamadı' 
    });
  }
  
  orders[orderIndex].status = status;
  orders[orderIndex].updatedAt = new Date();
  
  // Eğer sipariş tamamlanıyorsa ek bilgileri ekle
  if (status === 'completed') {
    orders[orderIndex].completed_at = completed_at || new Date().toISOString();
    orders[orderIndex].completedAt = new Date(orders[orderIndex].completed_at).toLocaleString('tr-TR');
    orders[orderIndex].duration = duration || 0;
    
    // Çalışan bilgilerini ekle
    if (employeeId && employeeName) {
      orders[orderIndex].completedBy = {
        employeeId: employeeId,
        employeeName: employeeName
      };
      
      // Aktif vardiyayı bul ve güncelle
      const activeShift = employeeShifts.find(shift => 
        shift.employeeId === employeeId && shift.endTime === null
      );
      
      if (activeShift) {
        activeShift.totalOrders += 1;
        activeShift.totalRevenue += orders[orderIndex].total || 0;
        
        // Ortalama sipariş süresini güncelle
        const orderTimes = employeePerformance
          .filter(perf => perf.employeeId === employeeId && perf.type === 'order')
          .map(perf => perf.duration);
        
        orderTimes.push(duration || 0);
        activeShift.averageOrderTime = orderTimes.reduce((sum, time) => sum + time, 0) / orderTimes.length;
        
        console.log('👤 Çalışan performansı güncellendi:', employeeName, '- Toplam sipariş:', activeShift.totalOrders);
      }
      
      // Performans kaydı ekle
      employeePerformance.push({
        id: 'PERF' + Date.now(),
        employeeId: employeeId,
        employeeName: employeeName,
        type: 'order',
        orderId: orderId,
        duration: duration || 0,
        revenue: orders[orderIndex].total || 0,
        timestamp: new Date().toISOString()
      });
      
      // Performans verilerini dosyaya kaydet
      saveDataToFile(EMPLOYEE_PERFORMANCE_FILE, employeePerformance);
      saveDataToFile(EMPLOYEE_SHIFTS_FILE, employeeShifts);
    }
    
    console.log('✅ Sipariş tamamlandı:', orderId, 'Süre:', duration, 'dakika');
  }
  
  console.log('📋 Sipariş durumu güncellendi:', orderId, '->', status);

  // 🔌 SOCKET — Tüm ekranlara anlık güncelleme
  emitOrderUpdate(orderId, status, orders[orderIndex]?.tableNumber);
  
  res.json({ 
    success: true, 
    data: orders[orderIndex],
    message: 'Sipariş durumu güncellendi' 
  });
});

// GARSON ÇAĞRISI API'LERİ
app.post('/api/waiter-calls', (req, res) => {
  // 'message' (eski) veya 'reason' (QRMenu) — ikisini de kabul et
  const callMessage = req.body.message || req.body.reason || 'Garson çağrısı';
  const call = {
    id: 'CALL' + Date.now(),
    tableNumber: req.body.tableNumber || req.body.tableId,
    message: callMessage,
    reason: callMessage,
    status: 'pending',
    createdAt: new Date(),
    created_at: new Date().toISOString()
  };
  
  waiterCalls.unshift(call);
  console.log('📞 Garson çağrısı:', 'Masa', call.tableNumber, '-', call.message);

  // 🔌 SOCKET — Anlık bildirim
  emitWaiterCall(call);
  
  res.json({ 
    success: true, 
    data: call, 
    message: 'Garson çağrısı alındı' 
  });
});

// Garson çağrısı listesini getir
app.get('/api/waiter-calls', (req, res) => {
  res.json({
    success: true,
    data: waiterCalls,
    message: 'Garson çağrıları listelendi'
  });
});

// Garson çağrısı durumu güncelle
app.put('/api/waiter-calls/:id', (req, res) => {
  const callId = req.params.id;
  const { status, completedAt, duration, employeeId, employeeName } = req.body;
  
  const callIndex = waiterCalls.findIndex(call => call.id === callId);
  if (callIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Garson çağrısı bulunamadı' 
    });
  }
  
  waiterCalls[callIndex].status = status;
  waiterCalls[callIndex].updatedAt = new Date();
  
  if (completedAt) {
    waiterCalls[callIndex].completedAt = completedAt;
  }
  
  if (duration) {
    waiterCalls[callIndex].duration = duration;
  }
  
  // Eğer garson çağrısı tamamlanıyorsa çalışan bilgilerini ekle
  if (status === 'completed' && employeeId && employeeName) {
    waiterCalls[callIndex].completedBy = {
      employeeId: employeeId,
      employeeName: employeeName
    };
    
    // Aktif vardiyayı bul ve güncelle
    const activeShift = employeeShifts.find(shift => 
      shift.employeeId === employeeId && shift.endTime === null
    );
    
    if (activeShift) {
      activeShift.totalWaiterCalls += 1;
      console.log('👤 Çalışan garson çağrısı tamamladı:', employeeName, '- Toplam çağrı:', activeShift.totalWaiterCalls);
    }
    
    // Performans kaydı ekle
    employeePerformance.push({
      id: 'PERF' + Date.now(),
      employeeId: employeeId,
      employeeName: employeeName,
      type: 'waiter_call',
      callId: callId,
      duration: duration || 0,
      timestamp: new Date().toISOString()
    });
    
    // Performans verilerini dosyaya kaydet
    saveDataToFile(EMPLOYEE_PERFORMANCE_FILE, employeePerformance);
    saveDataToFile(EMPLOYEE_SHIFTS_FILE, employeeShifts);
  }
  
  console.log('📞 Garson çağrısı durumu güncellendi:', callId, '->', status);
  
  res.json({ 
    success: true, 
    data: waiterCalls[callIndex],
    message: 'Garson çağrısı durumu güncellendi' 
  });
});

// Garson çağrısı sil
app.delete('/api/waiter-calls/:id', (req, res) => {
  const callId = req.params.id;
  
  const callIndex = waiterCalls.findIndex(call => call.id === callId);
  if (callIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Garson çağrısı bulunamadı' 
    });
  }
  
  waiterCalls.splice(callIndex, 1);
  console.log('🗑️ Garson çağrısı silindi:', callId);
  
  res.json({ 
    success: true, 
    message: 'Garson çağrısı silindi' 
  });
});

// VARDİYA YÖNETİMİ API'LERİ

// Çalışan vardiya durumu kontrolü
app.get('/api/employee/shift/status/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  
  // Aktif vardiyayı bul
  const activeShift = employeeShifts.find(shift => 
    shift.employeeId === employeeId && shift.endTime === null
  );
  
  if (activeShift) {
    console.log('👤 Aktif vardiya bulundu:', activeShift.employeeName);
    res.json({
      success: true,
      shift: activeShift
    });
  } else {
    console.log('👤 Aktif vardiya bulunamadı:', employeeId);
    res.json({
      success: true,
      shift: null
    });
  }
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

// Veriler artık dosyadan yüklendiği için temizleme fonksiyonuna gerek yok
console.log('📁 Veriler dosyadan yüklendi - Kalıcı depolama aktif');

// ============================================================
// TERMAL YAZICI API
// ============================================================
let ThermalPrinter, PrinterTypes, CharacterSet;
try {
  const thermal = require('node-thermal-printer');
  ThermalPrinter = thermal.ThermalPrinter;
  PrinterTypes = thermal.PrinterTypes;
  CharacterSet = thermal.CharacterSet;
  console.log('🖨️ Termal yazıcı modülü yüklendi');
} catch (e) {
  console.log('⚠️ Termal yazıcı modülü yüklenemedi:', e.message);
}

// Yazıcı ayarları (Settings sayfasından güncellenebilir)
let printerConfig = {
  // KASA YAZICISI — Garson adisyon butonuna basınca çalışır
  kasa: {
    enabled: true,
    type: 'EPSON',
    interface: 'tcp',
    host: '192.168.1.200',
    port: 9100,
    windowsPrinterName: '',
    cafeName: 'Kafe Sipariş',
    cafeAddress: '',
    cafePhone: '',
    currency: '₺'
  },
  // MUTFAK YAZICISI — Yeni sipariş gelince otomatik çalışır
  mutfak: {
    enabled: true,
    type: 'EPSON',
    interface: 'tcp',
    host: '192.168.1.201',
    port: 9100,
    windowsPrinterName: '',
    cafeName: 'MUTFAK'
  }
};

// Yazıcı ayarlarını dosyadan yükle
const PRINTER_CONFIG_FILE = path.join(dataDir, 'printer_config.json');
if (fs.existsSync(PRINTER_CONFIG_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(PRINTER_CONFIG_FILE, 'utf8'));
    // Eski format uyumluluğu — kasa/mutfak yapısına geç
    if (saved.kasa) {
      printerConfig = saved;
    } else {
      printerConfig.kasa = { ...printerConfig.kasa, ...saved };
    }
    console.log('🖨️ Yazıcı ayarları yüklendi');
  } catch (e) {
    console.log('⚠️ Yazıcı ayarları yüklenemedi');
  }
}

// Yazıcı bağlantı adresi oluştur
function getPrinterInterface(cfg) {
  if (cfg.interface === 'tcp') {
    return `tcp://${cfg.host}:${cfg.port}`;
  } else if (cfg.interface === 'printer') {
    return `printer:${cfg.windowsPrinterName}`;
  } else {
    return cfg.windowsPrinterName
      ? `printer:${cfg.windowsPrinterName}`
      : `tcp://${cfg.host}:${cfg.port}`;
  }
}

// Yazıcı nesnesi oluştur
function createPrinter(cfg) {
  if (!ThermalPrinter) throw new Error('Termal yazıcı modülü yüklü değil');
  return new ThermalPrinter({
    type: cfg.type === 'STAR' ? PrinterTypes.STAR : PrinterTypes.EPSON,
    interface: getPrinterInterface(cfg),
    characterSet: CharacterSet.PC857_TURKISH,
    removeSpecialCharacters: false,
    lineCharacter: '-',
    options: { timeout: 5000 }
  });
}

// ============================================================
// KASA ADİSYONU — Garson butona basınca çalışır
// ============================================================
async function printReceipt(order) {
  const cfg = printerConfig.kasa;
  if (!cfg.enabled) throw new Error('Kasa yazıcısı devre dışı');

  const printer = createPrinter(cfg);
  const isConnected = await printer.isPrinterConnected();
  if (!isConnected) throw new Error('Kasa yazıcısına bağlanılamadı');

  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR');
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const items = order.items || [];
  const total = parseFloat(order.total || 0);

  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println(cfg.cafeName);
  printer.bold(false);
  printer.setTextNormal();
  if (cfg.cafeAddress) printer.println(cfg.cafeAddress);
  if (cfg.cafePhone) printer.println('Tel: ' + cfg.cafePhone);
  printer.drawLine();

  printer.alignLeft();
  printer.println('Masa    : ' + (order.tableNumber || order.tableId || '?'));
  printer.println('Siparis : ' + (order.id || '-'));
  printer.println('Tarih   : ' + dateStr + ' ' + timeStr);
  if (order.waiter) printer.println('Garson  : ' + order.waiter);
  printer.drawLine();

  printer.bold(true);
  printer.tableCustom([
    { text: 'Urun', align: 'LEFT', width: 0.5 },
    { text: 'Adet', align: 'CENTER', width: 0.15 },
    { text: 'Fiyat', align: 'RIGHT', width: 0.35 }
  ]);
  printer.bold(false);
  printer.drawLine();

  items.forEach(item => {
    const lineTotal = (parseFloat(item.price || 0) * parseInt(item.quantity || 1)).toFixed(2);
    printer.tableCustom([
      { text: (item.name || 'Urun').substring(0, 20), align: 'LEFT', width: 0.5 },
      { text: String(item.quantity || 1), align: 'CENTER', width: 0.15 },
      { text: lineTotal + (cfg.currency || '₺'), align: 'RIGHT', width: 0.35 }
    ]);
    if (item.notes) printer.println('  Not: ' + item.notes);
  });

  printer.drawLine();
  printer.alignRight();

  // KDV satırı — aktifse göster
  if (taxConfig.enabled && taxConfig.rate > 0) {
    const kdvAmount = taxConfig.inclusive
      ? total - total / (1 + taxConfig.rate / 100)  // KDV dahil ise
      : total * taxConfig.rate / 100;                 // KDV hariç ise
    const kdvLabel = taxConfig.label || 'KDV';
    if (!taxConfig.inclusive) {
      printer.setTextNormal();
      printer.println('Ara Toplam: ' + total.toFixed(2) + ' ' + (cfg.currency || '₺'));
    }
    printer.println(`${kdvLabel} (%${taxConfig.rate}): ${kdvAmount.toFixed(2)} ${cfg.currency || '₺'}`);
    if (!taxConfig.inclusive) {
      printer.drawLine();
    }
  }

  printer.bold(true);
  printer.setTextSize(1, 1);
  const finalTotal = taxConfig.enabled && taxConfig.rate > 0 && !taxConfig.inclusive
    ? total * (1 + taxConfig.rate / 100)
    : total;
  printer.println('TOPLAM: ' + finalTotal.toFixed(2) + ' ' + (cfg.currency || '₺'));
  printer.bold(false);
  printer.setTextNormal();

  if (order.notes) {
    printer.alignLeft();
    printer.drawLine();
    printer.println('Not: ' + order.notes);
  }

  printer.drawLine();
  printer.alignCenter();
  printer.println('Tesekkur ederiz!');
  printer.println('Iyi gunler dileriz');
  printer.println('');
  printer.println('Fis No: ' + Date.now().toString().slice(-8));
  printer.cut();

  await printer.execute();
  console.log('🖨️ [KASA] Adisyon yazdırıldı - Masa:', order.tableNumber || order.tableId);
}

// ============================================================
// MUTFAK SİPARİŞ FİŞİ (KOT) — Yeni sipariş gelince otomatik
// ============================================================
async function printKitchenOrder(order) {
  const cfg = printerConfig.mutfak;
  if (!cfg || !cfg.enabled) {
    console.log('ℹ️ Mutfak yazıcısı devre dışı, atlanıyor');
    return;
  }

  if (!ThermalPrinter) {
    console.log('⚠️ Termal yazıcı modülü yok, mutfak fişi atlandı');
    return;
  }

  try {
    const printer = createPrinter(cfg);
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.log('⚠️ Mutfak yazıcısına bağlanılamadı, atlanıyor');
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const items = order.items || [];

    // Mutfak fişi tasarımı — büyük, net, hızlı okunur
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('*** MUTFAK SİPARİŞİ ***');
    printer.bold(false);
    printer.setTextNormal();
    printer.drawLine();

    printer.alignLeft();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('MASA: ' + (order.tableNumber || order.tableId || '?'));
    printer.setTextNormal();
    printer.bold(false);
    printer.println('Saat: ' + timeStr);
    printer.println('No  : ' + (order.id || '-'));
    printer.drawLine();

    // Ürünleri büyük yaz — mutfakta hızlı okunmalı
    items.forEach(item => {
      printer.bold(true);
      printer.setTextSize(1, 1);
      printer.println(item.quantity + 'x  ' + (item.name || 'Urun').substring(0, 18));
      printer.setTextNormal();
      printer.bold(false);
      if (item.notes) {
        printer.println('    >> ' + item.notes);
      }
    });

    printer.drawLine();

    if (order.notes) {
      printer.bold(true);
      printer.println('NOT: ' + order.notes);
      printer.bold(false);
      printer.drawLine();
    }

    printer.alignCenter();
    printer.println(timeStr);
    printer.cut();

    await printer.execute();
    console.log('🍳 [MUTFAK] Sipariş fişi yazdırıldı - Masa:', order.tableNumber || order.tableId, '- Ürün:', items.length);
  } catch (err) {
    // Mutfak yazıcısı hatası siparişi engellemez, sadece loglanır
    console.error('⚠️ [MUTFAK] Yazıcı hatası (sipariş kaydedildi):', err.message);
  }
}

// ---- YAZICI API ENDPOINT'LERİ ----

// Tüm yazıcı ayarlarını getir
app.get('/api/printer/config', (req, res) => {
  res.json({ success: true, data: printerConfig });
});

// Yazıcı ayarlarını güncelle
app.put('/api/printer/config', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  if (!currentUser || currentUser.role !== 'ceo') {
    return res.status(403).json({ success: false, message: 'CEO yetkisi gerekli' });
  }
  // Kasa veya mutfak ayarlarını güncelle
  if (req.body.kasa) printerConfig.kasa = { ...printerConfig.kasa, ...req.body.kasa };
  if (req.body.mutfak) printerConfig.mutfak = { ...printerConfig.mutfak, ...req.body.mutfak };
  fs.writeFileSync(PRINTER_CONFIG_FILE, JSON.stringify(printerConfig, null, 2), 'utf8');
  console.log('🖨️ Yazıcı ayarları güncellendi');
  res.json({ success: true, data: printerConfig, message: 'Yazıcı ayarları kaydedildi' });
});

// Yazıcı bağlantı testi (kasa veya mutfak)
app.post('/api/printer/test', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  if (!currentUser || !['ceo', 'yonetici'].includes(currentUser.role)) {
    return res.status(403).json({ success: false, message: 'Yetki gerekli' });
  }
  if (!ThermalPrinter) {
    return res.status(500).json({ success: false, message: 'Termal yazıcı modülü yüklü değil' });
  }

  const yazici = req.body.yazici || 'kasa'; // 'kasa' veya 'mutfak'
  const cfg = printerConfig[yazici];
  if (!cfg) return res.status(400).json({ success: false, message: 'Geçersiz yazıcı tipi' });

  try {
    const printer = createPrinter(cfg);
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) return res.json({ success: false, message: yazici + ' yazıcısına bağlanılamadı' });

    printer.alignCenter();
    printer.bold(true);
    printer.println('--- TEST: ' + yazici.toUpperCase() + ' YAZICISI ---');
    printer.bold(false);
    printer.println(cfg.cafeName || yazici);
    printer.println(new Date().toLocaleString('tr-TR'));
    printer.println('Yazici calisiyor!');
    printer.cut();
    await printer.execute();

    res.json({ success: true, message: yazici + ' yazıcısı çalışıyor!' });
  } catch (error) {
    console.error('🖨️ Yazıcı test hatası:', error.message);
    res.json({ success: false, message: 'Yazıcı hatası: ' + error.message });
  }
});

// Kasa adisyonu yazdır (manuel — garson butona basar)
app.post('/api/printer/print', async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ success: false, message: 'Sipariş ID gerekli' });
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
  try {
    await printReceipt(order);
    res.json({ success: true, message: 'Adisyon yazdırıldı' });
  } catch (error) {
    console.error('🖨️ Yazdırma hatası:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Kasa adisyonu — sipariş verisiyle (ID olmadan)
app.post('/api/printer/print-data', async (req, res) => {
  const { order } = req.body;
  if (!order) return res.status(400).json({ success: false, message: 'Sipariş verisi gerekli' });
  try {
    await printReceipt(order);
    res.json({ success: true, message: 'Adisyon yazdırıldı' });
  } catch (error) {
    console.error('🖨️ Yazdırma hatası:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mutfak fişi — manuel tetikleme (opsiyonel)
app.post('/api/printer/kitchen', async (req, res) => {
  const { orderId } = req.body;
  const order = orderId ? orders.find(o => o.id === orderId) : req.body.order;
  if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
  try {
    await printKitchenOrder(order);
    res.json({ success: true, message: 'Mutfak fişi yazdırıldı' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// DENETİM GÜNLÜĞÜ (AUDIT LOG)
// ============================================================
const AUDIT_LOG_FILE = path.join(dataDir, 'audit_log.json');
let auditLog = loadDataFromFile(AUDIT_LOG_FILE, []);

// Denetim kaydı oluştur
function addAuditLog(action, details, req) {
  const token = req?.headers?.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const user = users.find(u => u.id === userId);

  const entry = {
    id: 'AUDIT_' + Date.now(),
    timestamp: new Date().toISOString(),
    userId: userId || null,
    userName: user?.name || 'Sistem',
    userRole: user?.role || 'system',
    action,
    details,
    ip: req?.ip || req?.connection?.remoteAddress || '-'
  };

  auditLog.unshift(entry);
  // Son 5000 kaydı tut
  if (auditLog.length > 5000) auditLog = auditLog.slice(0, 5000);
  saveDataToFile(AUDIT_LOG_FILE, auditLog);
  console.log(`📋 [AUDIT] ${entry.userName} — ${action}`);
  return entry;
}

// Denetim günlüğünü getir (CEO only)
app.get('/api/audit-log', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);

  if (!currentUser || currentUser.role !== 'ceo') {
    return res.status(403).json({ success: false, message: 'CEO yetkisi gerekli' });
  }

  const { action, user: filterUser, date, limit = 100, offset = 0 } = req.query;
  let filtered = [...auditLog];

  if (action) filtered = filtered.filter(e => e.action.toLowerCase().includes(action.toLowerCase()));
  if (filterUser) filtered = filtered.filter(e => e.userName.toLowerCase().includes(filterUser.toLowerCase()));
  if (date) filtered = filtered.filter(e => e.timestamp.startsWith(date));

  const total = filtered.length;
  const page = filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.json({ success: true, data: page, total, limit: parseInt(limit), offset: parseInt(offset) });
});

// ============================================================
// KASA YÖNETİMİ
// ============================================================
const CASH_REGISTER_FILE = path.join(dataDir, 'cash_register.json');
let cashRegisterSessions = loadDataFromFile(CASH_REGISTER_FILE, []);

// Aktif kasa oturumunu bul
function getActiveCashSession() {
  return cashRegisterSessions.find(s => s.status === 'open');
}

// Kasa durumunu getir
app.get('/api/cash-register/status', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  if (!currentUser || !['ceo', 'yonetici'].includes(currentUser.role)) {
    return res.status(403).json({ success: false, message: 'Yetki gerekli' });
  }

  const active = getActiveCashSession();
  res.json({ success: true, data: active || null, isOpen: !!active });
});

// Kasa açılışı
app.post('/api/cash-register/open', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  if (!currentUser || !['ceo', 'yonetici'].includes(currentUser.role)) {
    return res.status(403).json({ success: false, message: 'Yetki gerekli' });
  }

  const existing = getActiveCashSession();
  if (existing) {
    return res.status(400).json({ success: false, message: 'Kasa zaten açık' });
  }

  const { openingCash, notes } = req.body;
  const session = {
    id: 'KASA_' + Date.now(),
    openedBy: currentUser.name,
    openedById: currentUser.id,
    openedAt: new Date().toISOString(),
    openingCash: parseFloat(openingCash || 0),
    notes: notes || '',
    status: 'open',
    closedAt: null,
    closingCash: null,
    expectedCash: null,
    cashDifference: null,
    totalSales: { cash: 0, card: 0, transfer: 0, mixed: 0, total: 0 },
    orderCount: 0
  };

  cashRegisterSessions.unshift(session);
  saveDataToFile(CASH_REGISTER_FILE, cashRegisterSessions);
  addAuditLog('KASA_ACILIS', `Kasa açıldı. Başlangıç: ₺${session.openingCash}`, req);

  console.log(`💰 Kasa açıldı: ${currentUser.name} — ₺${session.openingCash}`);
  res.json({ success: true, data: session, message: 'Kasa açıldı' });
});

// Kasa kapanışı
app.post('/api/cash-register/close', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  if (!currentUser || !['ceo', 'yonetici'].includes(currentUser.role)) {
    return res.status(403).json({ success: false, message: 'Yetki gerekli' });
  }

  const session = getActiveCashSession();
  if (!session) {
    return res.status(400).json({ success: false, message: 'Açık kasa bulunamadı' });
  }

  const { closingCash, notes } = req.body;

  // Bugünkü tamamlanan siparişleri hesapla
  const sessionStart = new Date(session.openedAt);
  const sessionOrders = orders.filter(o => {
    if (o.status !== 'completed') return false;
    const paidAt = new Date(o.paidAt || o.completed_at || o.createdAt);
    return paidAt >= sessionStart;
  });

  const totalSales = { cash: 0, card: 0, transfer: 0, mixed: 0, total: 0 };
  sessionOrders.forEach(o => {
    const method = o.paymentMethod || 'cash';
    const amount = parseFloat(o.finalTotal || o.total || 0);
    totalSales[method] = (totalSales[method] || 0) + amount;
    totalSales.total += amount;
  });

  const closingCashNum = parseFloat(closingCash || 0);
  const expectedCash = session.openingCash + totalSales.cash;
  const cashDifference = closingCashNum - expectedCash;

  const idx = cashRegisterSessions.findIndex(s => s.id === session.id);
  cashRegisterSessions[idx] = {
    ...session,
    status: 'closed',
    closedBy: currentUser.name,
    closedById: currentUser.id,
    closedAt: new Date().toISOString(),
    closingCash: closingCashNum,
    expectedCash,
    cashDifference,
    totalSales,
    orderCount: sessionOrders.length,
    closingNotes: notes || ''
  };

  saveDataToFile(CASH_REGISTER_FILE, cashRegisterSessions);
  addAuditLog('KASA_KAPANIS', `Kasa kapatıldı. Toplam: ₺${totalSales.total.toFixed(2)}, Fark: ₺${cashDifference.toFixed(2)}`, req);

  console.log(`💰 Kasa kapatıldı: ${currentUser.name} — Toplam: ₺${totalSales.total.toFixed(2)}`);
  res.json({ success: true, data: cashRegisterSessions[idx], message: 'Kasa kapatıldı' });
});

// Kasa geçmişi
app.get('/api/cash-register/history', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  if (!currentUser || !['ceo', 'yonetici'].includes(currentUser.role)) {
    return res.status(403).json({ success: false, message: 'Yetki gerekli' });
  }
  res.json({ success: true, data: cashRegisterSessions.slice(0, 30) });
});

// ============================================================
// MEVCUT ENDPOINT'LERE DENETİM GÜNLÜĞÜ EKLE
// ============================================================

// Login'e audit ekle — mevcut login endpoint'ini wrap et
const originalLoginHandler = app._router.stack.find(r => r.route?.path === '/api/auth/login');

// ============================================================
// MASA BAZLI SİPARİŞLER + CHECKOUT + AKTİF DURUM
// ============================================================

// Masanın tüm aktif siparişlerini getir
app.get('/api/tables/:tableNum/orders', (req, res) => {
  const tableNum = parseInt(req.params.tableNum);
  const tableOrders = orders.filter(o =>
    (parseInt(o.tableNumber) === tableNum || parseInt(o.tableId) === tableNum) &&
    o.status !== 'completed' && o.status !== 'cancelled'
  );
  const total = tableOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  res.json({ success: true, data: tableOrders, total, tableNum });
});

// Masa bazlı toplu ödeme — tüm aktif siparişleri öde ve masayı sıfırla
app.post('/api/tables/:tableNum/checkout', async (req, res) => {
  const tableNum = parseInt(req.params.tableNum);
  const { paymentMethod, discount, discountPercent, notes, shouldPrint } = req.body;

  const tableOrders = orders.filter(o =>
    (parseInt(o.tableNumber) === tableNum || parseInt(o.tableId) === tableNum) &&
    o.status !== 'completed' && o.status !== 'cancelled'
  );

  if (tableOrders.length === 0) {
    return res.status(404).json({ success: false, message: `Masa ${tableNum}'de aktif sipariş bulunamadı` });
  }

  const subtotal = tableOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const percentOff = parseFloat(discountPercent || 0);
  const discountAmount = parseFloat(discount || 0) + (percentOff > 0 ? subtotal * percentOff / 100 : 0);
  const finalTotal = Math.max(0, parseFloat((subtotal - discountAmount).toFixed(2)));
  const paidAt = new Date().toISOString();

  const allItems = [];
  tableOrders.forEach(o => (o.items || []).forEach(item => allItems.push(item)));

  tableOrders.forEach(order => {
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx !== -1) {
      orders[idx].status = 'completed';
      orders[idx].paymentMethod = paymentMethod || 'cash';
      orders[idx].paidAt = paidAt;
      orders[idx].discount = discountAmount / tableOrders.length;
      orders[idx].discountPercent = percentOff;
      orders[idx].finalTotal = parseFloat((parseFloat(order.total || 0) - discountAmount / tableOrders.length).toFixed(2));
      orders[idx].checkoutNotes = notes || '';
      archivedOrders.unshift({ ...orders[idx], archivedAt: paidAt });
    }
  });

  if (archivedOrders.length > 10000) archivedOrders = archivedOrders.slice(0, 10000);
  saveDataToFile(ARCHIVED_ORDERS_FILE, archivedOrders);
  delete tableStatus[tableNum];
  delete tableSplitPayments[tableNum];
  clearTableSessions(tableNum);

  orders = orders.filter(o =>
    !((parseInt(o.tableNumber) === tableNum || parseInt(o.tableId) === tableNum) && o.status === 'completed')
  );

  addAuditLog('HESAP_ODEME', `Masa ${tableNum} hesabı ödendi. Toplam: ₺${finalTotal.toFixed(2)} (${paymentMethod})`, req);
  console.log(`💳 Masa ${tableNum} hesabı ödendi — ₺${finalTotal.toFixed(2)} (${paymentMethod})`);

  // 🔌 SOCKET — Masa boşaldı, tüm ekranlar güncellenir
  emitTableUpdate(tableNum, 'checkout');

  let printed = false;
  if (shouldPrint !== false && ThermalPrinter) {
    try {
      await printReceipt({
        tableNumber: tableNum,
        items: allItems,
        total: finalTotal,
        notes: notes || '',
        paymentMethod: paymentMethod || 'cash',
        discount: discountAmount,
        paidAt
      });
      printed = true;
    } catch (err) {
      console.error('🖨️ Otomatik adisyon hatası:', err.message);
    }
  }

  res.json({
    success: true,
    message: `Masa ${tableNum} hesabı ödendi. Masa sıfırlandı.`,
    data: { tableNum, orderCount: tableOrders.length, subtotal, discount: discountAmount, discountPercent: percentOff, finalTotal, paymentMethod, paidAt, printed, isFullyPaid: true }
  });
});

// Masa durumu listesi (kasa ve POS için)
app.get('/api/tables/active-status', (req, res) => {
  const activeTableNums = [...new Set(
    orders
      .filter(o => o.status !== 'completed' && o.status !== 'cancelled')
      .map(o => parseInt(o.tableNumber || o.tableId))
      .filter(n => !isNaN(n))
  )];

  const result = activeTableNums.map(tableNum => {
    const tableOrders = orders.filter(o =>
      (parseInt(o.tableNumber) === tableNum || parseInt(o.tableId) === tableNum) &&
      o.status !== 'completed' && o.status !== 'cancelled'
    );
    const total = tableOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
    const openedAt = tableOrders.reduce((earliest, o) => {
      const t = new Date(o.createdAt || o.timestamp);
      return t < earliest ? t : earliest;
    }, new Date());

    const allItems = [];
    tableOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const existing = allItems.find(i => i.name === item.name && i.notes === (item.notes || ''));
        if (existing) { existing.quantity += parseInt(item.quantity || 1); }
        else { allItems.push({ ...item, quantity: parseInt(item.quantity || 1) }); }
      });
    });

    return {
      tableNum,
      orderCount: tableOrders.length,
      total,
      openedAt: openedAt.toISOString(),
      items: allItems,
      notes: tableOrders.map(o => o.notes).filter(Boolean).join(' | ')
    };
  });

  res.json({ success: true, data: result });
});

// ============================================================
// MÜŞTERİ HESAP GÖRÜNTÜLEME
// ============================================================

// Masanın mevcut açık hesabını getir (müşteri QR'dan görebilsin)
app.get('/api/tables/:tableNum/bill', (req, res) => {
  const tableNum = parseInt(req.params.tableNum);
  const tableOrders = orders.filter(o =>
    (parseInt(o.tableNumber) === tableNum || parseInt(o.tableId) === tableNum) &&
    o.status !== 'completed' && o.status !== 'cancelled'
  );

  const allItems = [];
  tableOrders.forEach(order => {
    (order.items || []).forEach(item => {
      allItems.push({
        name: item.name,
        quantity: parseInt(item.quantity || 1),
        price: parseFloat(item.price || 0),
        notes: item.notes || '',
        orderId: order.id,
        orderedAt: order.createdAt || order.timestamp
      });
    });
  });

  const subtotal = tableOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const orderCount = tableOrders.length;
  const splitPayments = tableSplitPayments[tableNum] || [];
  const totalPaid = splitPayments.reduce((s, p) => s + parseFloat(p.thisPaidAmount || 0), 0);
  const remaining = Math.max(0, parseFloat((subtotal - totalPaid).toFixed(2)));

  res.json({
    success: true,
    data: {
      tableNum,
      orderCount,
      items: allItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalPaid: parseFloat(totalPaid.toFixed(2)),
      remaining,
      splitPayments,
      openedAt: tableOrders.length > 0
        ? tableOrders.reduce((earliest, o) => {
            const t = new Date(o.createdAt || o.timestamp);
            return t < new Date(earliest) ? (o.createdAt || o.timestamp) : earliest;
          }, tableOrders[0].createdAt || tableOrders[0].timestamp)
        : null
    }
  });
});

// ============================================================
// PARÇALI ÖDEME (Bölerek Ödeme)
// ============================================================

// Masanın toplam tutarını N kişiye böl ve ödeme al
app.post('/api/tables/:tableNum/split-payment', (req, res) => {
  const tableNum = parseInt(req.params.tableNum);
  const { splitCount, paidCount, paymentMethod, notes } = req.body;
  // splitCount: kaç parçaya bölünüyor (örn: 4)
  // paidCount: şu an kaç kişi ödüyor (örn: 1)

  const tableOrders = orders.filter(o =>
    (parseInt(o.tableNumber) === tableNum || parseInt(o.tableId) === tableNum) &&
    o.status !== 'completed' && o.status !== 'cancelled'
  );

  if (tableOrders.length === 0) {
    return res.status(404).json({ success: false, message: `Masa ${tableNum}'de aktif sipariş yok` });
  }

  const totalAmount = tableOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const existingPayments = tableSplitPayments[tableNum] || [];
  const alreadyPaid = existingPayments.reduce((s, p) => s + parseFloat(p.thisPaidAmount || 0), 0);
  const remainingBefore = Math.max(0, parseFloat((totalAmount - alreadyPaid).toFixed(2)));

  if (remainingBefore < 0.01) {
    return res.status(400).json({ success: false, message: 'Hesap zaten tamamen ödendi' });
  }

  const perPersonAmount = parseFloat((remainingBefore / parseInt(splitCount || 1)).toFixed(2));
  let thisPaidAmount = perPersonAmount * parseInt(paidCount || 1);
  if (req.body.customAmount != null && parseFloat(req.body.customAmount) > 0) {
    thisPaidAmount = Math.min(parseFloat(req.body.customAmount), remainingBefore);
  }

  // Parçalı ödeme kaydı oluştur (siparişleri kapatmaz, sadece kayıt tutar)
  const paymentRecord = {
    id: 'SPLIT_' + Date.now(),
    tableNum,
    totalAmount,
    remainingBefore,
    splitCount: parseInt(splitCount || 1),
    paidCount: parseInt(paidCount || 1),
    perPersonAmount,
    thisPaidAmount,
    paymentMethod: paymentMethod || 'cash',
    notes: notes || '',
    paidAt: new Date().toISOString()
  };

  // Split payment'ları takip et
  if (!tableSplitPayments[tableNum]) tableSplitPayments[tableNum] = [];
  tableSplitPayments[tableNum].push(paymentRecord);

  const totalPaid = tableSplitPayments[tableNum].reduce((s, p) => s + p.thisPaidAmount, 0);
  const remaining = Math.max(0, totalAmount - totalPaid);
  const isFullyPaid = remaining < 0.01;

  addAuditLog('PARCALI_ODEME', `Masa ${tableNum} — ${paidCount}/${splitCount} kişi ödedi: ₺${thisPaidAmount.toFixed(2)}`, req);

  // Tam ödendi mi kontrol et
  if (isFullyPaid) {
    // Masayı kapat
    const paidAt = new Date().toISOString();
    tableOrders.forEach(order => {
      const idx = orders.findIndex(o => o.id === order.id);
      if (idx !== -1) {
        orders[idx].status = 'completed';
        orders[idx].paymentMethod = 'split';
        orders[idx].paidAt = paidAt;
        orders[idx].splitPayments = tableSplitPayments[tableNum];
        archivedOrders.unshift({ ...orders[idx], archivedAt: paidAt });
      }
    });
    delete tableSplitPayments[tableNum];
    clearTableSessions(tableNum);
    delete tableStatus[tableNum];
    orders = orders.filter(o =>
      !((parseInt(o.tableNumber) === tableNum || parseInt(o.tableId) === tableNum) && o.status === 'completed')
    );
    saveDataToFile(ARCHIVED_ORDERS_FILE, archivedOrders);
  }

  res.json({
    success: true,
    data: {
      ...paymentRecord,
      totalPaid: parseFloat(totalPaid.toFixed(2)),
      remaining: parseFloat(remaining.toFixed(2)),
      isFullyPaid
    },
    message: isFullyPaid
      ? `Hesap tam ödendi! Masa ${tableNum} sıfırlandı.`
      : `₺${thisPaidAmount.toFixed(2)} ödendi. Kalan: ₺${remaining.toFixed(2)}`
  });
});

// ============================================================
// MASA BAZLI ADİSYON + HESAP ÖDEME + MASA SIFIRLAMA
// (Tek ve güncel versiyon — eski duplicate kaldırıldı)
// ============================================================

// Frontend SPA için catch-all route (API olmayan tüm istekler)
const frontendDistIndex = path.join(__dirname, '../frontend/dist/index.html');
if (fs.existsSync(frontendDistIndex)) {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
      res.sendFile(frontendDistIndex);
    }
  });
}

// ============================================================
// KASA POS — Personel sipariş + POS terminal
// ============================================================

function getStaffUserId(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  return isNaN(userId) ? null : userId;
}

// Kasadan masa siparişi (QR session gerekmez)
app.post('/api/pos/orders', (req, res) => {
  const userId = getStaffUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Yetkisiz' });

  const { tableNumber, items, total, notes } = req.body;
  const tableNum = parseInt(tableNumber);
  if (!tableNum || !items?.length) {
    return res.status(400).json({ success: false, message: 'Masa ve ürünler gerekli' });
  }

  const order = {
    id: 'ORD' + Date.now(),
    tableNumber: tableNum,
    items: items || [],
    total: parseFloat(total || 0),
    notes: notes || '',
    status: 'pending',
    createdAt: new Date(),
    created_at: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    createdByStaff: userId,
    source: 'pos'
  };

  orders.unshift(order);
  if (!tableStatus[tableNum]) {
    tableStatus[tableNum] = { status: 'occupied', openedAt: order.created_at, totalAmount: 0 };
  }
  tableStatus[tableNum].status = 'occupied';
  tableStatus[tableNum].totalAmount = (tableStatus[tableNum].totalAmount || 0) + order.total;

  printKitchenOrder(order).catch(err => console.error('Mutfak yazıcı:', err.message));
  addAuditLog('POS_SIPARIS', `Kasa — Masa ${tableNum} sipariş ₺${order.total}`, req);

  // 🔌 SOCKET — Mutfak + sipariş takibi anlık güncellenir
  emitNewOrder(order);

  res.json({ success: true, data: order, message: `Masa ${tableNum} siparişi eklendi` });
});

// POS ödeme terminaline tutar gönder (entegrasyon yapılandırmasına bağlı)
const POS_CONFIG_FILE = path.join(dataDir, 'pos_config.json');
let posConfig = { enabled: false, type: 'simulation', apiUrl: '', apiKey: '' };
try {
  if (fs.existsSync(POS_CONFIG_FILE)) {
    posConfig = { ...posConfig, ...JSON.parse(fs.readFileSync(POS_CONFIG_FILE, 'utf8')) };
  }
} catch (e) { /* varsayılan */ }

app.get('/api/pos/config', (req, res) => {
  res.json({ success: true, data: { enabled: posConfig.enabled, type: posConfig.type } });
});

app.post('/api/pos/send-to-terminal', async (req, res) => {
  const userId = getStaffUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Yetkisiz' });

  const amount = parseFloat(req.body.amount);
  const tableNum = parseInt(req.body.tableNum);
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Geçerli tutar gerekli' });
  }

  const transactionRef = 'POS' + Date.now();
  let terminalMessage = `₺${amount.toFixed(2)} POS cihazına aktarıldı`;

  if (posConfig.enabled && posConfig.type === 'http' && posConfig.apiUrl) {
    try {
      const https = require('https');
      const http = require('http');
      const url = new URL(posConfig.apiUrl);
      const body = JSON.stringify({ amount, tableNum, currency: 'TRY', ref: transactionRef });
      await new Promise((resolve, reject) => {
        const lib = url.protocol === 'https:' ? https : http;
        const reqHttp = lib.request(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            ...(posConfig.apiKey ? { Authorization: `Bearer ${posConfig.apiKey}` } : {})
          }
        }, resHttp => {
          resHttp.on('data', () => {});
          resHttp.on('end', resolve);
        });
        reqHttp.on('error', reject);
        reqHttp.write(body);
        reqHttp.end();
      });
      terminalMessage = 'Tutar harici POS API\'sine gönderildi';
    } catch (err) {
      console.error('POS API hatası:', err.message);
      return res.status(502).json({ success: false, message: 'POS cihazına bağlanılamadı: ' + err.message });
    }
  } else {
    console.log(`💳 [POS Simülasyon] Masa ${tableNum} — ₺${amount.toFixed(2)} — Ref: ${transactionRef}`);
  }

  addAuditLog('POS_TERMINAL', `Masa ${tableNum} — ₺${amount.toFixed(2)} POS'a gönderildi`, req);

  res.json({
    success: true,
    message: terminalMessage,
    data: { transactionRef, amount, tableNum, simulation: !posConfig.enabled || posConfig.type === 'simulation' }
  });
});

// ============================================================
// KDV / VERGİ AYARLARI
// ============================================================
const TAX_CONFIG_FILE = path.join(dataDir, 'tax_config.json');
let taxConfig = { enabled: false, rate: 10, label: 'KDV', inclusive: false };
try {
  if (fs.existsSync(TAX_CONFIG_FILE)) {
    taxConfig = { ...taxConfig, ...JSON.parse(fs.readFileSync(TAX_CONFIG_FILE, 'utf8')) };
  }
} catch (e) { /* varsayılan */ }

// KDV config getir (herkese açık — fiş/qr menu için)
app.get('/api/tax/config', (req, res) => {
  res.json({ success: true, data: taxConfig });
});

// KDV config güncelle (CEO)
app.put('/api/tax/config', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  if (!currentUser || currentUser.role !== 'ceo') {
    return res.status(403).json({ success: false, message: 'CEO yetkisi gerekli' });
  }
  taxConfig = { ...taxConfig, ...req.body };
  fs.writeFileSync(TAX_CONFIG_FILE, JSON.stringify(taxConfig, null, 2), 'utf8');
  addAuditLog('KDV_AYAR', `KDV ayarları güncellendi: %${taxConfig.rate} (${taxConfig.enabled ? 'aktif' : 'devre dışı'})`, req);
  res.json({ success: true, data: taxConfig, message: 'KDV ayarları kaydedildi' });
});

// ============================================================
// STOK DURUMU TOPLU GÜNCELLEME
// ============================================================
app.put('/api/menu/bulk-availability', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = parseInt(token?.split('_')[1]);
  const currentUser = users.find(u => u.id === userId);
  if (!currentUser || !['ceo', 'yonetici'].includes(currentUser.role)) {
    return res.status(403).json({ success: false, message: 'Yetki gerekli' });
  }
  const { updates } = req.body; // [{ id, available }]
  if (!Array.isArray(updates)) return res.status(400).json({ success: false, message: 'updates array gerekli' });
  updates.forEach(({ id, available }) => {
    const idx = menuItems.findIndex(m => m.id === parseInt(id));
    if (idx > -1) menuItems[idx].available = available;
  });
  res.json({ success: true, message: `${updates.length} ürün güncellendi` });
});

// ============================================================
// SOCKET.IO — Gerçek Zamanlı Bağlantı
// ============================================================
const http = require('http');
const { Server } = require('socket.io');

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: false
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Bağlantı yönetimi
io.on('connection', (socket) => {
  console.log(`🔌 Socket bağlandı: ${socket.id}`);

  // Tüm bağlananlar 'restaurant' odasına katılır
  socket.join('restaurant');

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket ayrıldı: ${socket.id} (${reason})`);
  });
});

// Global io — endpoint'lerden erişim için
global.io = io;

// ---- Socket yayın yardımcıları ----
function emitNewOrder(order) {
  if (global.io) {
    global.io.to('restaurant').emit('new_order', {
      id: order.id,
      tableNumber: order.tableNumber || order.tableId,
      items: order.items,
      total: order.total,
      notes: order.notes,
      status: order.status,
      createdAt: order.createdAt || order.timestamp
    });
  }
}

function emitOrderUpdate(orderId, status, tableNumber) {
  if (global.io) {
    global.io.to('restaurant').emit('order_updated', { id: orderId, status, tableNumber });
  }
}

function emitWaiterCall(call) {
  if (global.io) {
    global.io.to('restaurant').emit('waiter_call', {
      id: call.id,
      tableNumber: call.tableNumber,
      message: call.message || call.reason,
      status: call.status,
      createdAt: call.created_at
    });
  }
}

function emitTableUpdate(tableNum, action) {
  if (global.io) {
    global.io.to('restaurant').emit('table_update', { tableNum, action });
  }
}

// Server başlatma
httpServer.listen(PORT, () => {
  console.log('🚀 BACKEND SERVER BAŞLADI');
  console.log('├── Port:', PORT);
  console.log('├── Socket.io: ✅ Aktif (gerçek zamanlı)');
  console.log('├── Menü ürünleri:', menuItems.length);
  console.log('├── Kullanıcılar:', users.length);
  console.log('├── Çalışan vardiyaları:', employeeShifts.length);
  console.log('├── Performans kayıtları:', employeePerformance.length);
  console.log('├── API Endpoints:');
  console.log('│   ├── POST /api/auth/login');
  console.log('│   ├── GET  /api/auth/profile');
  console.log('│   ├── GET  /api/users');
  console.log('│   ├── POST /api/users');
  console.log('│   ├── PUT  /api/users/:id');
  console.log('│   ├── DELETE /api/users/:id');
  console.log('│   ├── GET  /api/menu');
  console.log('│   ├── POST /api/menu');
  console.log('│   ├── PUT  /api/menu/:id');
  console.log('│   ├── DELETE /api/menu/:id');
  console.log('│   ├── GET  /api/orders');
  console.log('│   ├── POST /api/orders');
  console.log('│   ├── PUT  /api/orders/:id');
  console.log('│   ├── POST /api/waiter-calls');
  console.log('│   ├── POST /api/employee/shift/start');
  console.log('│   ├── POST /api/employee/shift/end');
  console.log('│   └── GET  /api/employee/performance');
  console.log('├── Default CEO Login:');
  console.log('│   ├── Username: ceo');
  console.log('│   └── Password: ceo123');
  console.log('└── Frontend URL: http://localhost:8080');
});
