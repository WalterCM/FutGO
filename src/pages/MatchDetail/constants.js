export const KIT_LIBRARY = [
    // ========== COLORES ==========
    // ========== CÁLIDOS ==========
    { name: 'Rojo', color: '#ffffff', bg: '#dc2626', border: '#b91c1c', categories: ['color'] },
    { name: 'Naranja', color: '#ffffff', bg: '#f97316', border: '#ea580c', categories: ['color'] },
    { name: 'Amarillo', color: '#000000', bg: '#facc15', border: '#ca8a04', categories: ['color'] },
    { name: 'Marrón', color: '#ffffff', bg: '#78350f', border: '#5d2508', categories: ['color'] },
    { name: 'Rosado', color: '#000000', bg: '#f472b6', border: '#db2777', categories: ['color'] },
    { name: 'Crema', color: '#800000', bg: '#fdf5e6', border: '#800000', categories: ['color'] },
    // ========== FRÍOS ==========
    { name: 'Morado', color: '#ffffff', bg: '#9333ea', border: '#7e22ce', categories: ['color'] },
    { name: 'Azul', color: '#ffffff', bg: '#2563eb', border: '#1d4ed8', categories: ['color'] },
    { name: 'Celeste', color: '#000000', bg: '#7dd3fc', border: '#0ea5e9', categories: ['color'] },
    { name: 'Turquesa', color: '#000000', bg: '#2dd4bf', border: '#14b8a6', categories: ['color'] },
    { name: 'Verde', color: '#ffffff', bg: '#16a34a', border: '#15803d', categories: ['color'] },
    { name: 'Lima', color: '#000000', bg: '#84cc16', border: '#65a30d', categories: ['color'] },
    // ========== NEUTROS ==========
    { name: 'Blanco', color: '#000000', bg: '#ffffff', border: '#d1d5db', categories: ['color'] },
    { name: 'Negro', color: '#ffffff', bg: '#111827', border: '#374151', categories: ['color'] },
    { name: 'Gris Claro', color: '#000000', bg: '#9ca3af', border: '#6b7280', categories: ['color'] },

    // ========== CLUBES PERUANOS ==========
    { name: 'Crema', color: '#800000', bg: '#fdf5e6', border: '#800000', categories: ['club_peruano'] },
    { name: 'Blanquiazul', color: '#ffffff', bg: '#002366', border: '#ffffff', categories: ['club_peruano'] },
    { name: 'Celeste', color: '#000000', bg: '#7dd3fc', border: '#0ea5e9', categories: ['club_peruano'] },
    { name: 'Rojo y Negro', color: '#ffffff', bg: 'linear-gradient(90deg, #991b1b 0%, #991b1b 50%, #111827 50%, #111827 100%)', border: '#dc2626', categories: ['club_peruano'] },
    { name: 'Rosado', color: '#000000', bg: '#f472b6', border: '#db2777', categories: ['club_peruano'] },

    // ========== CLUBES INTERNACIONALES ==========
    { name: 'Azul Grana', color: '#facc15', bg: 'linear-gradient(90deg, #a50044 0%, #a50044 50%, #004d98 50%, #004d98 100%)', border: '#facc15', categories: ['club_internacional'] },
    { name: 'Blanco', color: '#000000', bg: '#ffffff', border: '#d1d5db', categories: ['club_internacional'] },

    // ========== SELECCIONES ==========
    { name: 'Blanquirroja', color: '#000000', bg: 'linear-gradient(135deg, #ffffff 0%, #ffffff 40%, #dc2626 40%, #dc2626 60%, #ffffff 60%, #ffffff 100%)', border: '#dc2626', categories: ['seleccion'] },
    { name: 'Albiceleste', color: '#00385b', bg: 'linear-gradient(90deg, #7dd3fc 0%, #7dd3fc 33%, #ffffff 33%, #ffffff 66%, #7dd3fc 66%, #7dd3fc 100%)', border: '#0284c7', categories: ['seleccion'] },
    { name: 'Verde Amarela', color: '#004d00', bg: 'linear-gradient(90deg, #facc15 0%, #facc15 50%, #16a34a 50%, #16a34a 100%)', border: '#16a34a', categories: ['seleccion'] },
    { name: 'Naranja', color: '#ffffff', bg: '#f97316', border: '#ea580c', categories: ['seleccion'] },

    // ========== OTROS ==========
    { name: 'Azul y Oro', color: '#facc15', bg: '#002366', border: '#facc15', categories: ['otros'] },
    { name: 'Negro y Oro', color: '#facc15', bg: '#111827', border: '#facc15', categories: ['otros'] },
]

export const DEFAULT_KIT = { name: 'Equipo', color: '#ffffff', bg: 'rgba(255,255,255,0.05)', border: 'var(--border)', categories: [] }
export const BENCH_KIT = { name: 'Banca', color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.05)', border: 'var(--border)', categories: [] }

// Solo kits de la categoria colores
export const COLOR_KITS = KIT_LIBRARY.filter(kit => kit.categories?.includes('color'))

export const CATEGORIES = [
    { id: 'color', name: 'Colores', icon: '🎨' },
    { id: 'club_peruano', name: 'Clubes Peruanos', icon: '🇵🇪' },
    { id: 'club_internacional', name: 'Clubes Int.', icon: '🌎' },
    { id: 'seleccion', name: 'Selecciones', icon: '🏆' },
    { id: 'otros', name: 'Otros', icon: '🔸' },
]