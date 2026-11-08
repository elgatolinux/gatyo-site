// Every visible string on the site lives here.
export type Lang = 'es' | 'en'

export const DISCORD_URL = 'https://discord.gg/Hpzua3uQmV'
export const AUTHOR = 'GatoboNito6404'
export const MUSIC_CREDIT = 'FALL FROM THE SKY PT. 2 (Slowed) — RomancePlanet & STAKILLAZ'

const es = {
  meta: {
    title: 'Gatyo · Client para Minecraft Bedrock en Android',
    description:
      'Gatyo es un client para Minecraft Bedrock en Android (1.21.111): shaders, cuatro interfaces y personalización a fondo.',
  },
  nav: { skip: 'Saltar al Discord', language: 'Idioma', scenes: 'Escenas', top: 'Volver al inicio' },
  slates: {
    '01': 'HERO',
    '02': 'VIDEO',
    '03': 'SHADERS',
    '04': 'INTERFACES',
    '05': 'PERSONALIZACIÓN',
    '06': 'CATEGORÍAS',
    '07': 'AUTOMAPART',
    '08': 'FINAL',
  },
  hero: {
    phrase: 'Hazlo tuyo hasta el último píxel.',
    compat: 'Para Minecraft Bedrock en Android · 1.21.111',
    release: 'v1.0.0 · build 183',
    scroll: 'Baja despacio',
  },
  promo: {
    title: 'Primero, míralo.',
    body: 'Un repaso rápido antes de entrar en detalle.',
    play: 'Reproducir',
    pause: 'Pausar',
    soundOn: 'Activar sonido',
    soundOff: 'Silenciar',
    music: 'Música',
    videoLabel: 'Video promocional de Gatyo',
  },
  shaders: {
    title: 'Shaders sobre jugadores.',
    body: 'Se aplican a jugadores, cristales, tus manos y la interfaz, y se combinan con Skybox, Ambience y Nametags.',
    fills: 'rellenos',
    outlines: 'contornos',
    samples: ['Galaxia', 'Arcoíris', 'Fuego', 'Holograma', 'Cromo'],
  },
  gallery: {
    title: 'Cuatro formas de abrir el mismo menú.',
    tabsLabel: 'Elegir interfaz',
    items: [
      { name: 'Panel', desc: 'El panel clásico, ordenado por secciones.', alt: 'Captura de la interfaz Panel de Gatyo' },
      { name: 'ClickGUI', desc: 'Una ventana por categoría, todas a la vista.', alt: 'Captura de la interfaz ClickGUI de Gatyo' },
      { name: 'Tarjetas', desc: 'Buscador, categorías y favoritos.', alt: 'Captura de la interfaz Tarjetas de Gatyo' },
      { name: 'Liquid Glass', desc: 'Cristal que refracta el juego que tiene detrás.', alt: 'Captura de la interfaz Liquid Glass de Gatyo' },
    ],
  },
  custom: {
    title: 'Que no se parezca al de nadie.',
    video: { title: 'Video de fondo', body: 'Pon un video detrás del panel.' },
    anims: { label: 'animaciones de apertura y cierre' },
    accents: {
      label: 'colores de acento',
      hint: 'Elige uno y la página entera lo sigue.',
      names: ['Violeta', 'Rosa', 'Lavanda', 'Cian', 'Menta', 'Ámbar', 'Coral'],
    },
    sky: { title: 'Skybox y Ambience', body: 'Cambia el cielo y la niebla del mundo.' },
  },
  book: {
    title: 'Todo lo demás, por capítulos.',
    sheet: 'HOJA',
    chapters: [
      { title: 'Visuales', body: 'Lo que ves sobre cada jugador y en tu mano.', items: ['Shaders', 'Charms', 'Nametags', 'Números de daño', 'ViewModel', 'SwingSpeed'] },
      { title: 'Mundo', body: 'El ambiente y la forma de moverte por él con la vista.', items: ['Skybox', 'Ambience', 'Waypoints', 'Vista libre', 'Custom FOV', 'Full bright'] },
      { title: 'Interfaz', body: 'Tu pantalla, con lo que quieras tener a mano.', items: ['ArrayList', 'Gráfico de FPS', 'Efectos', 'Panel de información', 'Welcomer', 'Español / English'] },
      { title: 'Combate', body: 'También está. Esta hoja se queda así.', items: [] as string[] },
    ],
  },
  mapart: {
    title: 'De imagen a mapart.',
    body: 'AutoMapart Studio convierte una imagen en un plano de bloques y lo construye por franjas.',
    materials: 'materiales',
    maps: 'mapas como máximo',
  },
  final: {
    title: 'Aquí acaba la película.',
    body: 'Lo que sigue pasa en Discord.',
    cta: 'Unirme al Discord',
    madeBy: 'Hecho por',
    legal:
      'Proyecto no oficial, sin afiliación con Mojang ni Microsoft. Incluye módulos que pueden infringir las reglas de los servidores y conllevar un baneo. Úsalo bajo tu responsabilidad.',
  },
}

export type Dict = typeof es

const en: Dict = {
  meta: {
    title: 'Gatyo · Client for Minecraft Bedrock on Android',
    description:
      'Gatyo is a client for Minecraft Bedrock on Android (1.21.111): shaders, four interfaces and deep customization.',
  },
  nav: { skip: 'Skip to Discord', language: 'Language', scenes: 'Scenes', top: 'Back to top' },
  slates: {
    '01': 'HERO',
    '02': 'FILM',
    '03': 'SHADERS',
    '04': 'INTERFACES',
    '05': 'CUSTOMIZATION',
    '06': 'CATEGORIES',
    '07': 'AUTOMAPART',
    '08': 'END',
  },
  hero: {
    phrase: 'Make it yours, down to the last pixel.',
    compat: 'For Minecraft Bedrock on Android · 1.21.111',
    release: 'v1.0.0 · build 183',
    scroll: 'Scroll slowly',
  },
  promo: {
    title: 'Watch this first.',
    body: 'A quick tour before the details.',
    play: 'Play',
    pause: 'Pause',
    soundOn: 'Turn sound on',
    soundOff: 'Mute',
    music: 'Music',
    videoLabel: 'Gatyo promo video',
  },
  shaders: {
    title: 'Shaders on players.',
    body: 'They work on players, crystals, your hands and the interface, and they stack with Skybox, Ambience and Nametags.',
    fills: 'fills',
    outlines: 'outlines',
    samples: ['Galaxy', 'Rainbow', 'Fire', 'Hologram', 'Chrome'],
  },
  gallery: {
    title: 'Four ways to open the same menu.',
    tabsLabel: 'Choose an interface',
    items: [
      { name: 'Panel', desc: 'The classic panel, organized by section.', alt: 'Screenshot of the Gatyo Panel interface' },
      { name: 'ClickGUI', desc: 'One window per category, all in view.', alt: 'Screenshot of the Gatyo ClickGUI interface' },
      { name: 'Cards', desc: 'Search, categories and favorites.', alt: 'Screenshot of the Gatyo Cards interface' },
      { name: 'Liquid Glass', desc: 'Glass that refracts the game behind it.', alt: 'Screenshot of the Gatyo Liquid Glass interface' },
    ],
  },
  custom: {
    title: 'Nobody else’s setup looks like yours.',
    video: { title: 'Video background', body: 'Put a video behind the panel.' },
    anims: { label: 'open and close animations' },
    accents: {
      label: 'accent colors',
      hint: 'Pick one and the whole page follows.',
      names: ['Violet', 'Pink', 'Lavender', 'Cyan', 'Mint', 'Amber', 'Coral'],
    },
    sky: { title: 'Skybox and Ambience', body: 'Change the sky and the fog of the world.' },
  },
  book: {
    title: 'Everything else, by chapter.',
    sheet: 'PAGE',
    chapters: [
      { title: 'Visuals', body: 'What you see on every player and in your hand.', items: ['Shaders', 'Charms', 'Nametags', 'Damage numbers', 'ViewModel', 'SwingSpeed'] },
      { title: 'World', body: 'The atmosphere, and how you look around in it.', items: ['Skybox', 'Ambience', 'Waypoints', 'Free look', 'Custom FOV', 'Full bright'] },
      { title: 'Interface', body: 'Your screen, with what you want close at hand.', items: ['ArrayList', 'FPS graph', 'Effects', 'Info panel', 'Welcomer', 'Español / English'] },
      { title: 'Combat', body: 'It’s in there too. This page stays short.', items: [] as string[] },
    ],
  },
  mapart: {
    title: 'From image to mapart.',
    body: 'AutoMapart Studio turns an image into a block plan and builds it strip by strip.',
    materials: 'materials',
    maps: 'maps at most',
  },
  final: {
    title: 'That’s the end of the film.',
    body: 'What happens next happens on Discord.',
    cta: 'Join the Discord',
    madeBy: 'Made by',
    legal:
      'Unofficial project, not affiliated with Mojang or Microsoft. Includes modules that may break server rules and get you banned. Use at your own risk.',
  },
}

export const DICTS: Record<Lang, Dict> = { es, en }
