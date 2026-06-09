/**
 * Basit i18n servisi — QR Menü için TR/EN/AR
 * Vue-i18n kurulumu gerektirmez, reactive değil ama yeterli
 */

export const LANGUAGES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'rtl' }
]

const translations = {
  tr: {
    search_placeholder: 'Menüde ara...',
    waiter_btn:         '🔔 Garson',
    bill_btn:           '🧾 Hesabım',
    loading:            'Menü yükleniyor...',
    no_results:         'Sonuç bulunamadı',
    search_label:       'Arama Sonuçları',
    results_count:      '{n} ürün',
    cart_view:          'Sepeti Görüntüle',
    cart_title:         '🛒 Sepetim',
    order_note:         'Sipariş notu',
    order_note_ph:      'Genel not (acele değil, vb.)',
    total:              'Toplam',
    confirm_order:      '✅ Siparişi Onayla',
    qr_required:        '🔒 QR Okutun',
    sending:            'Gönderiliyor...',
    special_req:        'Özel istek (opsiyonel)',
    special_req_ph:     'Az baharatlı, ekstra sos vb.',
    add_to_cart:        'Sepete Ekle',
    waiter_title:       '🔔 Garson Çağır',
    waiter_cancel:      'İptal',
    order_success_title:'Siparişiniz Alındı!',
    order_success_sub:  'Garsonumuz en kısa sürede gelecek',
    ok:                 'Tamam',
    bill_title:         '🧾 Hesabım',
    bill_empty:         'Henüz açık hesap yok',
    bill_orders:        '{n} sipariş verildi',
    bill_pay_note:      'Ödeme kasada veya garson aracılığıyla yapılır.',
    request_bill:       '🙋 Garsona Hesap İste',
    loading_bill:       '⏳ Yükleniyor...',
    waiter_bill:        '🧾 Hesap İstiyorum',
    waiter_bill_msg:    'Hesap istiyoruz',
    waiter_water:       '💧 Su İstiyorum',
    waiter_water_msg:   'Su getirir misiniz?',
    waiter_napkin:      '🧻 Peçete Lazım',
    waiter_napkin_msg:  'Peçete getirir misiniz?',
    waiter_help:        '❓ Yardım Lazım',
    waiter_help_msg:    'Yardıma ihtiyacım var',
    waiter_called:      '✅ Garson çağrıldı!',
    table_label:        'Masa',
    preparing:          'hazırlanıyor',
    // Kategori çevirileri
    cat_icecekler:      'İçecekler',
    cat_yemekler:       'Yemekler',
    cat_tatlilar:       'Tatlılar',
    cat_atistirmaliklar:'Atıştırmalıklar',
    cat_salatalar:      'Salatalar',
    cat_corbalar:       'Çorbalar',
    cat_kahvalti:       'Kahvaltı',
    cat_pizzalar:       'Pizzalar',
    cat_burgerler:      'Burgerler',
    cat_makarnalar:     'Makarnalar',
    cat_kahveler:       'Kahveler',
    cat_caylar:         'Çaylar',
    cat_ana_yemekler:   'Ana Yemekler',
    cat_baslangiçlar:   'Başlangıçlar',
    cat_pastalar:       'Pastalar',
    cat_dondurma:       'Dondurma',
    cat_aperatifler:    'Aperatifler'
  },
  en: {
    search_placeholder: 'Search menu...',
    waiter_btn:         '🔔 Waiter',
    bill_btn:           '🧾 My Bill',
    loading:            'Loading menu...',
    no_results:         'No results found',
    search_label:       'Search Results',
    results_count:      '{n} items',
    cart_view:          'View Cart',
    cart_title:         '🛒 My Cart',
    order_note:         'Order note',
    order_note_ph:      'General note (not urgent, etc.)',
    total:              'Total',
    confirm_order:      '✅ Confirm Order',
    qr_required:        '🔒 Scan QR',
    sending:            'Sending...',
    special_req:        'Special request (optional)',
    special_req_ph:     'Less spicy, extra sauce, etc.',
    add_to_cart:        'Add to Cart',
    waiter_title:       '🔔 Call Waiter',
    waiter_cancel:      'Cancel',
    order_success_title:'Order Received!',
    order_success_sub:  'Our waiter will be with you shortly',
    ok:                 'OK',
    bill_title:         '🧾 My Bill',
    bill_empty:         'No open bill yet',
    bill_orders:        '{n} orders placed',
    bill_pay_note:      'Payment is made at the cashier or through the waiter.',
    request_bill:       '🙋 Request Bill',
    loading_bill:       '⏳ Loading...',
    waiter_bill:        '🧾 Request Bill',
    waiter_bill_msg:    'We would like the bill',
    waiter_water:       '💧 Water Please',
    waiter_water_msg:   'Could you bring water?',
    waiter_napkin:      '🧻 Need Napkins',
    waiter_napkin_msg:  'Could you bring napkins?',
    waiter_help:        '❓ Need Help',
    waiter_help_msg:    'I need assistance',
    waiter_called:      '✅ Waiter called!',
    table_label:        'Table',
    preparing:          'being prepared',
    // Category translations
    cat_icecekler:      'Beverages',
    cat_yemekler:       'Foods',
    cat_tatlilar:       'Desserts',
    cat_atistirmaliklar:'Snacks',
    cat_salatalar:      'Salads',
    cat_corbalar:       'Soups',
    cat_kahvalti:       'Breakfast',
    cat_pizzalar:       'Pizzas',
    cat_burgerler:      'Burgers',
    cat_makarnalar:     'Pastas',
    cat_kahveler:       'Coffees',
    cat_caylar:         'Teas',
    cat_ana_yemekler:   'Main Courses',
    cat_baslangiçlar:   'Starters',
    cat_pastalar:       'Cakes',
    cat_dondurma:       'Ice Cream',
    cat_aperatifler:    'Appetizers'
  },
  ar: {
    search_placeholder: 'ابحث في القائمة...',
    waiter_btn:         '🔔 نادل',
    bill_btn:           '🧾 حسابي',
    loading:            'جاري تحميل القائمة...',
    no_results:         'لا توجد نتائج',
    search_label:       'نتائج البحث',
    results_count:      '{n} منتجات',
    cart_view:          'عرض السلة',
    cart_title:         '🛒 سلتي',
    order_note:         'ملاحظة الطلب',
    order_note_ph:      'ملاحظة عامة',
    total:              'المجموع',
    confirm_order:      '✅ تأكيد الطلب',
    qr_required:        '🔒 امسح QR',
    sending:            'جاري الإرسال...',
    special_req:        'طلب خاص (اختياري)',
    special_req_ph:     'حار أقل، صوص إضافي...',
    add_to_cart:        'أضف إلى السلة',
    waiter_title:       '🔔 استدعاء النادل',
    waiter_cancel:      'إلغاء',
    order_success_title:'تم استلام طلبك!',
    order_success_sub:  'سيأتي النادل قريباً',
    ok:                 'حسناً',
    bill_title:         '🧾 حسابي',
    bill_empty:         'لا توجد فاتورة مفتوحة',
    bill_orders:        '{n} طلبات',
    bill_pay_note:      'يتم الدفع عند الكاشير أو عبر النادل.',
    request_bill:       '🙋 طلب الفاتورة',
    loading_bill:       '⏳ جاري التحميل...',
    waiter_bill:        '🧾 أريد الحساب',
    waiter_bill_msg:    'نريد الحساب',
    waiter_water:       '💧 أريد ماء',
    waiter_water_msg:   'هل يمكنك إحضار ماء؟',
    waiter_napkin:      '🧻 أحتاج مناديل',
    waiter_napkin_msg:  'هل يمكنك إحضار مناديل؟',
    waiter_help:        '❓ أحتاج مساعدة',
    waiter_help_msg:    'أحتاج إلى مساعدة',
    waiter_called:      '✅ تم استدعاء النادل!',
    table_label:        'طاولة',
    preparing:          'قيد التحضير',
    // ترجمات الفئات
    cat_icecekler:      'مشروبات',
    cat_yemekler:       'أطعمة',
    cat_tatlilar:       'حلويات',
    cat_atistirmaliklar:'وجبات خفيفة',
    cat_salatalar:      'سلطات',
    cat_corbalar:       'شوربات',
    cat_kahvalti:       'إفطار',
    cat_pizzalar:       'بيتزا',
    cat_burgerler:      'برجر',
    cat_makarnalar:     'معكرونة',
    cat_kahveler:       'قهوة',
    cat_caylar:         'شاي',
    cat_ana_yemekler:   'أطباق رئيسية',
    cat_baslangiçlar:   'مقبلات',
    cat_pastalar:       'كعك',
    cat_dondurma:       'آيس كريم',
    cat_aperatifler:    'مشهيات'
  }
}

export function t(lang, key, vars = {}) {
  const dict = translations[lang] || translations['tr']
  let str = dict[key] || translations['tr'][key] || key
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(`{${k}}`, v)
  })
  return str
}

export function getDir(lang) {
  return LANGUAGES.find(l => l.code === lang)?.dir || 'ltr'
}

// Kategori adını çevir
export function tCategory(lang, categoryName) {
  // Direkt kategori mapping (Türkçe karakter sorunlarını önlemek için)
  const categoryMap = {
    'İçecekler': 'cat_icecekler',
    'Yemekler': 'cat_yemekler',
    'Tatlılar': 'cat_tatlilar',
    'Atıştırmalıklar': 'cat_atistirmaliklar',
    'Salatalar': 'cat_salatalar',
    'Çorbalar': 'cat_corbalar',
    'Kahvaltı': 'cat_kahvalti',
    'Pizzalar': 'cat_pizzalar',
    'Burgerler': 'cat_burgerler',
    'Makarnalar': 'cat_makarnalar',
    'Kahveler': 'cat_kahveler',
    'Çaylar': 'cat_caylar',
    'Ana Yemekler': 'cat_ana_yemekler',
    'Başlangıçlar': 'cat_baslangiçlar',
    'Pastalar': 'cat_pastalar',
    'Dondurma': 'cat_dondurma',
    'Aperatifler': 'cat_aperatifler'
  }
  
  const key = categoryMap[categoryName]
  if (!key) {
    // Map'te yoksa orijinal adı döndür
    return categoryName
  }
  
  return t(lang, key)
}

export default { t, tCategory, LANGUAGES, getDir }
