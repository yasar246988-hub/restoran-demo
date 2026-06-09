// QR MENÜ TEMA SİSTEMİ
// 7 Farklı tema × 4 Sayfa Düzeni × Farklı Kategoriler = Sonsuz Kombinasyon!

// 4 FARKLI SAYFA DÜZENİ - Her Kategori için Özel Görünüm
export const PAGE_LAYOUTS = {
  // Layout 1: Grid Kartlar - Klasik ve Şık
  grid: {
    id: 'grid',
    name: 'Grid (Izgara)',
    description: 'Klasik kart düzeni - 2-3 sütun, büyük görseller',
    icon: '▦',
    layout: 'grid',
    imageSize: 'large',
    cardStyle: 'elevated',
    columns: 2,
    gap: '16px',
    showPrice: 'badge',
    showDescription: true,
    imageRatio: '4/3',
    titlePosition: 'bottom'
  },
  
  // Layout 2: Liste - Kompakt ve Detaylı
  list: {
    id: 'list',
    name: 'List (Liste)',
    description: 'Tek sütun liste - kompakt, detaylı açıklamalar',
    icon: '☰',
    layout: 'list',
    imageSize: 'medium',
    cardStyle: 'flat',
    columns: 1,
    gap: '12px',
    showPrice: 'inline',
    showDescription: true,
    imageRatio: '16/9',
    titlePosition: 'side'
  },
  
  // Layout 3: Masonry - Pinterest Tarzı
  masonry: {
    id: 'masonry',
    name: 'Masonry (Duvar)',
    description: 'Pinterest tarzı düzensiz yükseklik - görsel ağırlıklı',
    icon: '⊞',
    layout: 'masonry',
    imageSize: 'large',
    cardStyle: 'rounded',
    columns: 2,
    gap: '14px',
    showPrice: 'overlay',
    showDescription: false,
    imageRatio: 'auto',
    titlePosition: 'overlay'
  },
  
  // Layout 4: Horizontal Scroll - Instagram Tarzı
  horizontal: {
    id: 'horizontal',
    name: 'Horizontal (Yatay)',
    description: 'Yatay kaydırmalı galeri - Instagram stories tarzı',
    icon: '⇄',
    layout: 'horizontal',
    imageSize: 'xlarge',
    cardStyle: 'sharp',
    columns: 'auto',
    gap: '20px',
    showPrice: 'bottom',
    showDescription: false,
    imageRatio: '1/1',
    titlePosition: 'center'
  }
};

// KATEGORİ ÖZEL SAYFA DÜZENLERİ
// Her tema için her kategoriye özel layout ataması
export const CATEGORY_LAYOUTS = {
  // İçecekler - Yatay scroll veya grid
  'İçecekler': ['horizontal', 'grid', 'masonry', 'list'],
  'Kahveler': ['horizontal', 'grid', 'list', 'masonry'],
  'Çaylar': ['list', 'grid', 'horizontal', 'masonry'],
  
  // Yemekler - Grid veya liste
  'Yemekler': ['grid', 'list', 'masonry', 'horizontal'],
  'Ana Yemekler': ['list', 'grid', 'masonry', 'horizontal'],
  'Başlangıçlar': ['masonry', 'grid', 'horizontal', 'list'],
  
  // Tatlılar - Masonry veya grid
  'Tatlılar': ['masonry', 'grid', 'horizontal', 'list'],
  'Pastalar': ['masonry', 'horizontal', 'grid', 'list'],
  'Dondurma': ['horizontal', 'masonry', 'grid', 'list'],
  
  // Atıştırmalıklar - Horizontal veya masonry
  'Atıştırmalıklar': ['horizontal', 'masonry', 'grid', 'list'],
  'Aperatifler': ['horizontal', 'grid', 'masonry', 'list'],
  
  // Salatalar - Liste veya grid
  'Salatalar': ['list', 'grid', 'masonry', 'horizontal'],
  
  // Çorbalar - Liste
  'Çorbalar': ['list', 'grid', 'horizontal', 'masonry'],
  
  // Kahvaltı - Grid veya masonry
  'Kahvaltı': ['grid', 'masonry', 'list', 'horizontal'],
  
  // Pizza - Masonry veya grid
  'Pizzalar': ['masonry', 'grid', 'horizontal', 'list'],
  
  // Burger - Grid
  'Burgerler': ['grid', 'list', 'horizontal', 'masonry'],
  
  // Makarna - Liste
  'Makarnalar': ['list', 'grid', 'masonry', 'horizontal'],
  
  // Varsayılan
  'default': ['grid', 'list', 'masonry', 'horizontal']
};

// 7 FARKLI TEMA - Her birinde kategori bazlı özel sayfa düzenleri
export const THEMES = {
  modern: {
    id: 'modern',
    name: 'Modern Minimalist',
    description: 'Sade ve şık lacivert tasarım',
    icon: '🔷',
    colors: {
      primary: '#0f2d5c',
      primaryDark: '#081d3d',
      primaryLight: '#2563a8',
      accent: '#f0a500',
      bg: '#f0f4f9',
      cardBg: '#ffffff',
      text: '#1e293b',
      textLight: '#64748b',
      border: '#e2e8f0'
    },
    // Her kategori için özel düzen tercihleri
    categoryLayouts: {
      'İçecekler': 'horizontal',    // İçecekler yatay kaydırma
      'Tatlılar': 'masonry',        // Tatlılar masonry
      'Yemekler': 'grid',           // Yemekler grid
      'Çorbalar': 'list',           // Çorbalar liste
      'default': 'grid'
    },
    cardStyle: 'rounded',
    animation: 'fade',
    categoryAnimations: {
      'İçecekler': 'slideIn',
      'Tatlılar': 'fadeUp',
      'Yemekler': 'scaleIn',
      'default': 'fade'
    }
  },

  warm: {
    id: 'warm',
    name: 'Warm & Cozy',
    description: 'Sıcak kahverengi ve turuncu tonları',
    icon: '☕',
    colors: {
      primary: '#92400e',
      primaryDark: '#78350f',
      primaryLight: '#b45309',
      accent: '#f59e0b',
      bg: '#fef3c7',
      cardBg: '#fffbeb',
      text: '#78350f',
      textLight: '#a16207',
      border: '#fde68a'
    },
    categoryLayouts: {
      'Kahveler': 'list',           // Kahveler için detaylı liste
      'İçecekler': 'list',
      'Tatlılar': 'grid',           // Tatlılar grid
      'Kahvaltı': 'masonry',        // Kahvaltı masonry
      'default': 'list'
    },
    cardStyle: 'elevated',
    animation: 'slide',
    categoryAnimations: {
      'Kahveler': 'slideIn',
      'Tatlılar': 'bounce',
      'default': 'slide'
    }
  },

  fresh: {
    id: 'fresh',
    name: 'Fresh & Green',
    description: 'Doğal yeşil ve canlı tonlar',
    icon: '🌿',
    colors: {
      primary: '#065f46',
      primaryDark: '#064e3b',
      primaryLight: '#059669',
      accent: '#10b981',
      bg: '#ecfdf5',
      cardBg: '#f0fdf4',
      text: '#064e3b',
      textLight: '#047857',
      border: '#a7f3d0'
    },
    categoryLayouts: {
      'Salatalar': 'masonry',       // Salatalar masonry
      'İçecekler': 'horizontal',    // İçecekler horizontal
      'Çorbalar': 'list',           // Çorbalar liste
      'Yemekler': 'grid',           // Yemekler grid
      'default': 'masonry'
    },
    cardStyle: 'rounded',
    animation: 'scale',
    categoryAnimations: {
      'Salatalar': 'fadeUp',
      'İçecekler': 'slideIn',
      'default': 'scale'
    }
  },

  elegant: {
    id: 'elegant',
    name: 'Elegant Dark',
    description: 'Lüks siyah ve altın tema',
    icon: '✨',
    colors: {
      primary: '#0f172a',
      primaryDark: '#020617',
      primaryLight: '#1e293b',
      accent: '#fbbf24',
      bg: '#1e293b',
      cardBg: '#334155',
      text: '#f8fafc',
      textLight: '#cbd5e1',
      border: '#475569'
    },
    categoryLayouts: {
      'Yemekler': 'grid',           // Yemekler lüks grid
      'Ana Yemekler': 'list',       // Ana yemekler detaylı liste
      'Tatlılar': 'masonry',        // Tatlılar masonry
      'İçecekler': 'horizontal',    // İçecekler horizontal
      'default': 'grid'
    },
    cardStyle: 'elevated',
    animation: 'fade',
    categoryAnimations: {
      'Yemekler': 'fadeUp',
      'Tatlılar': 'scaleIn',
      'default': 'fade'
    }
  },

  vibrant: {
    id: 'vibrant',
    name: 'Vibrant & Fun',
    description: 'Renkli ve enerjik tasarım',
    icon: '🎨',
    colors: {
      primary: '#7c3aed',
      primaryDark: '#5b21b6',
      primaryLight: '#a78bfa',
      accent: '#ec4899',
      bg: '#faf5ff',
      cardBg: '#ffffff',
      text: '#581c87',
      textLight: '#a855f7',
      border: '#e9d5ff'
    },
    categoryLayouts: {
      'Atıştırmalıklar': 'horizontal', // Atıştırmalıklar horizontal
      'Tatlılar': 'masonry',           // Tatlılar masonry
      'İçecekler': 'grid',             // İçecekler renkli grid
      'Pizzalar': 'masonry',           // Pizzalar masonry
      'default': 'grid'
    },
    cardStyle: 'sharp',
    animation: 'scale',
    categoryAnimations: {
      'Atıştırmalıklar': 'bounce',
      'Tatlılar': 'fadeUp',
      'İçecekler': 'slideIn',
      'default': 'scale'
    }
  },

  vintage: {
    id: 'vintage',
    name: 'Vintage Parchment',
    description: 'Nostaljik parşömen ve kağıt dokulu',
    icon: '📜',
    colors: {
      primary: '#5c4033',
      primaryDark: '#3d2817',
      primaryLight: '#8b6f47',
      accent: '#d4a574',
      bg: '#f4ebe1',
      cardBg: '#faf6f0',
      text: '#3d2817',
      textLight: '#8b7355',
      border: '#d4c4b0'
    },
    categoryLayouts: {
      'Kahveler': 'list',              // Kahveler nostaljik liste
      'Çaylar': 'list',                // Çaylar liste
      'Tatlılar': 'grid',              // Tatlılar grid
      'Kahvaltı': 'horizontal',        // Kahvaltı horizontal
      'default': 'list'
    },
    cardStyle: 'flat',
    animation: 'none',
    categoryAnimations: {
      'Kahveler': 'fadeIn',
      'Tatlılar': 'fadeUp',
      'default': 'fadeIn'
    }
  },

  minimal: {
    id: 'minimal',
    name: 'Minimal Monochrome',
    description: 'Ultra minimalist siyah-beyaz-gri',
    icon: '⚫',
    colors: {
      primary: '#18181b',
      primaryDark: '#09090b',
      primaryLight: '#27272a',
      accent: '#71717a',
      bg: '#fafafa',
      cardBg: '#ffffff',
      text: '#09090b',
      textLight: '#52525b',
      border: '#e4e4e7'
    },
    categoryLayouts: {
      'Yemekler': 'list',              // Yemekler minimal liste
      'İçecekler': 'grid',             // İçecekler grid
      'Tatlılar': 'grid',              // Tatlılar grid
      'Salatalar': 'list',             // Salatalar liste
      'default': 'grid'
    },
    cardStyle: 'flat',
    animation: 'none',
    categoryAnimations: {
      'default': 'fadeIn'
    }
  }
};

export function getTheme(themeId) {
  return THEMES[themeId] || THEMES.modern;
}

export function getThemesList() {
  return Object.values(THEMES);
}

export function getLayoutsList() {
  return Object.values(PAGE_LAYOUTS);
}

export function getLayout(layoutId) {
  return PAGE_LAYOUTS[layoutId] || PAGE_LAYOUTS.grid;
}

// Kategori için tema bazlı özel layout al
export function getCategoryLayout(themeId, categoryName) {
  const theme = getTheme(themeId);
  if (!theme || !theme.categoryLayouts) {
    return 'grid';
  }
  
  // Tema'nın kategori özel layoutunu al, yoksa default'u al
  return theme.categoryLayouts[categoryName] || theme.categoryLayouts['default'] || 'grid';
}

// Kategori için animasyon tipini al
export function getCategoryAnimation(themeId, categoryName) {
  const theme = getTheme(themeId);
  if (!theme || !theme.categoryAnimations) {
    return theme?.animation || 'fade';
  }
  
  return theme.categoryAnimations[categoryName] || theme.categoryAnimations['default'] || theme.animation;
}

// Layout bilgilerini al
export function getLayoutConfig(layoutId) {
  const layout = getLayout(layoutId);
  return {
    ...layout,
    cssClass: `layout-${layout.id}`,
    containerStyle: layout.layout === 'horizontal' ? 'flex' : 'grid'
  };
}
