export interface Classic {
  slug: string
  title: string
  subtitle: string
  description: string
  tradition: string
  gutenbergUrl: string
  colorClass: string // tailwind text-* color
  coverPrompt: string // art direction for AI cover regeneration
  defaultCoverUrl: string // static SVG served from /classics/
  articleType?: string // passed to booksQueries.upload; defaults to 'fiction'
}

export const CLASSICS: Classic[] = [
  {
    slug: 'bible-douay-rheims',
    title: 'The Holy Bible',
    subtitle: 'Douay-Rheims (Catholic)',
    description: 'The Douay-Rheims Bible — the classic English Catholic translation from the Latin Vulgate, including the deuterocanonical books.',
    tradition: 'Christianity (Catholic)',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/8300/pg8300.txt',
    colorClass: 'text-blue-700',
    defaultCoverUrl: '/classics/bible-douay-rheims.svg',
    coverPrompt: 'The Holy Bible, Douay-Rheims Catholic edition. An illuminated manuscript page with the Virgin Mary, gold leaf borders, stained glass window light in deep blues and reds, sacred iconography, medieval Catholic art style.',
  },
  {
    slug: 'bible-web',
    title: 'The Holy Bible',
    subtitle: 'World English Bible (Modern)',
    description: 'The World English Bible — a modern, public-domain translation in clear contemporary English. A freely shareable alternative to the NIV.',
    tradition: 'Christianity (Protestant)',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/8294/pg8294.txt',
    colorClass: 'text-blue-500',
    defaultCoverUrl: '/classics/bible-web.svg',
    coverPrompt: 'The Holy Bible, World English Bible. A clean modern book design with a simple gold cross on white, soft light rays, contemporary typography, warm and inviting, accessible modern Christian art.',
  },
  {
    slug: 'bible-septuagint',
    title: 'The Septuagint',
    subtitle: 'Brenton English Translation (Orthodox)',
    description: 'The Septuagint (LXX) in English — the ancient Greek Old Testament used by the Orthodox Church, translated by Sir Lancelot Brenton (1851).',
    tradition: 'Christianity (Orthodox)',
    gutenbergUrl: '/classics/bible-septuagint.txt',
    colorClass: 'text-amber-700',
    defaultCoverUrl: '/classics/bible-septuagint.svg',
    coverPrompt: 'The Septuagint, Orthodox Bible. A Byzantine icon style with gold halos, rich jewel tones of ruby and sapphire, ancient Greek text, Orthodox cross with three bars, dome of a Greek church, sacred mosaic art.',
  },
  {
    slug: 'quran-pickthall',
    title: 'The Quran',
    subtitle: 'Pickthall Translation',
    description: "The holy book of Islam in Mohammad Marmaduke Pickthall's celebrated English translation.",
    tradition: 'Islam',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/7440/pg7440.txt',
    colorClass: 'text-green-600',
    defaultCoverUrl: '/classics/quran-pickthall.svg',
    coverPrompt: 'The Holy Quran. An ornate Islamic geometric arabesque pattern, intricate gold calligraphy on deep emerald and midnight blue, mosque architecture with crescent moon, sacred symmetry, masterful illuminated manuscript art.',
  },
  {
    slug: 'tao-te-ching',
    title: 'Tao Te Ching',
    subtitle: 'James Legge Translation',
    description: '81 verses on the nature of existence and the Way — the foundational Taoist text by Lao Tzu.',
    tradition: 'Taoism',
    gutenbergUrl: 'https://www.gutenberg.org/files/216/216.txt',
    colorClass: 'text-gray-500',
    defaultCoverUrl: '/classics/tao-te-ching.svg',
    coverPrompt: 'Tao Te Ching by Lao Tzu. A serene Chinese ink brush painting, misty mountain landscape with flowing water, yin-yang symbol, bamboo and pine trees, minimalist negative space, ancient Eastern philosophy, muted ink wash tones.',
  },
  {
    slug: 'dhammapada',
    title: 'The Dhammapada',
    subtitle: 'F. Max Müller Translation',
    description: '423 verses of Buddhist wisdom attributed to the Buddha on the path to liberation.',
    tradition: 'Buddhism',
    gutenbergUrl: 'https://www.gutenberg.org/files/2017/2017-0.txt',
    colorClass: 'text-amber-600',
    defaultCoverUrl: '/classics/dhammapada.svg',
    coverPrompt: 'The Dhammapada, Buddhist scripture. A glowing lotus flower emerging from still water at dawn, the Bodhi tree with golden leaves, soft saffron and amber light, peaceful meditation, Buddhist mandala, spiritual tranquility.',
  },
  {
    slug: 'bhagavad-gita',
    title: 'Bhagavad Gita',
    subtitle: "Edwin Arnold's The Song Celestial",
    description: "Krishna's teachings to Arjuna on duty, righteousness, and the nature of the self.",
    tradition: 'Hinduism',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/12/pg12.txt',
    colorClass: 'text-orange-500',
    defaultCoverUrl: '/classics/bhagavad-gita.svg',
    coverPrompt: 'Bhagavad Gita. Krishna and Arjuna on a divine chariot between two armies at Kurukshetra, radiant blue deity with sacred conch shell, epic Indian mythology, vibrant saffron and gold, dramatic celestial light, classical Hindu art.',
  },
  // Gothic / Horror
  {
    slug: 'frankenstein',
    title: 'Frankenstein',
    subtitle: 'Mary Shelley · 1818',
    description: 'The original science-fiction horror novel: a scientist creates life, only to be haunted by his creation.',
    tradition: 'Gothic Fiction',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/84/pg84.txt',
    colorClass: 'text-slate-500',
    defaultCoverUrl: '/classics/frankenstein.svg',
    coverPrompt: 'Frankenstein by Mary Shelley. A dark Gothic laboratory, lightning crackling over a monstrous figure on a table, candles flickering, stone archways, dramatic chiaroscuro, Romantic era horror, moody grey and electric blue.',
  },
  {
    slug: 'dracula',
    title: 'Dracula',
    subtitle: 'Bram Stoker · 1897',
    description: "The definitive vampire novel — Count Dracula's journey from Transylvania to England and the hunters who pursue him.",
    tradition: 'Gothic Fiction',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/345/pg345.txt',
    colorClass: 'text-red-700',
    defaultCoverUrl: '/classics/dracula.svg',
    coverPrompt: 'Dracula by Bram Stoker. A menacing castle silhouette against a blood-red moon, bats swirling, a dark caped figure with pale face and crimson eyes, gothic stonework, Victorian horror atmosphere, deep crimson and black.',
  },
  // Classic Fiction
  {
    slug: 'pride-and-prejudice',
    title: 'Pride & Prejudice',
    subtitle: 'Jane Austen · 1813',
    description: 'The sparkling comedy of manners following Elizabeth Bennet and the proud Mr Darcy through misunderstandings and love.',
    tradition: 'Classic Fiction',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/1342/pg1342.txt',
    colorClass: 'text-pink-500',
    defaultCoverUrl: '/classics/pride-and-prejudice.svg',
    coverPrompt: 'Pride and Prejudice by Jane Austen. An elegant English country house in spring, a Regency couple strolling amid flowering gardens, watercolour painterly style, soft pastels and romantic greens, Georgian refinement.',
  },
  {
    slug: 'crime-and-punishment',
    title: 'Crime & Punishment',
    subtitle: 'Fyodor Dostoevsky · 1866',
    description: "A student commits a murder and is consumed by guilt — Dostoevsky's masterpiece of psychological realism.",
    tradition: 'Classic Fiction',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/2554/pg2554.txt',
    colorClass: 'text-stone-600',
    defaultCoverUrl: '/classics/crime-and-punishment.svg',
    coverPrompt: 'Crime and Punishment by Dostoevsky. Dark St. Petersburg streets at night, gaslight reflecting on wet cobblestones, a tormented young man under a lamppost, expressionist shadows, oppressive tenements, muted ochre and grey tones.',
  },
  {
    slug: 'don-quixote',
    title: 'Don Quixote',
    subtitle: 'Cervantes · Ormsby Translation',
    description: 'The first modern novel: a knight-errant tilts at windmills and pursues impossible dreams across La Mancha.',
    tradition: 'Classic Fiction',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/996/pg996.txt',
    colorClass: 'text-yellow-600',
    defaultCoverUrl: '/classics/don-quixote.svg',
    coverPrompt: 'Don Quixote by Cervantes. A lanky knight on a thin horse charging a giant windmill on a dusty Spanish plain, squire Sancho Panza on a donkey watching, warm amber sunlight, painterly Spanish Golden Age style.',
  },
  // Shakespeare
  {
    slug: 'hamlet',
    title: 'Hamlet',
    subtitle: 'William Shakespeare · c.1600',
    description: '"To be or not to be" — Shakespeare\'s greatest tragedy of revenge, madness, and mortality.',
    tradition: 'Drama',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/1524/pg1524.txt',
    colorClass: 'text-violet-600',
    defaultCoverUrl: '/classics/hamlet.svg',
    coverPrompt: 'Hamlet by Shakespeare. A Danish prince holding a skull on the ramparts of Elsinore castle at night, moonlit sea below, ghostly apparition in the mist, dramatic Baroque chiaroscuro, deep purples and silver.',
  },
  {
    slug: 'romeo-and-juliet',
    title: 'Romeo & Juliet',
    subtitle: 'William Shakespeare · c.1595',
    description: 'The timeless tragedy of star-crossed lovers from rival families in Verona.',
    tradition: 'Drama',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/1112/pg1112.txt',
    colorClass: 'text-rose-500',
    defaultCoverUrl: '/classics/romeo-and-juliet.svg',
    coverPrompt: 'Romeo and Juliet by Shakespeare. A moonlit Verona balcony scene, a young woman in white leaning over roses, her lover below in shadow, Italian Renaissance architecture, warm candlelight, romantic and melancholy atmosphere.',
  },
  // Adventure & Sci-Fi
  {
    slug: 'twenty-thousand-leagues',
    title: '20,000 Leagues Under the Sea',
    subtitle: 'Jules Verne · 1870',
    description: "Captain Nemo's submarine Nautilus explores the ocean depths in Verne's visionary sci-fi adventure.",
    tradition: 'Adventure',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/164/pg164.txt',
    colorClass: 'text-cyan-600',
    defaultCoverUrl: '/classics/twenty-thousand-leagues.svg',
    coverPrompt: '20,000 Leagues Under the Sea by Jules Verne. A sleek Victorian submarine cruising through bioluminescent deep ocean, giant squid attacking, porthole windows glowing, Art Nouveau style, deep teal and electric blue.',
  },
  {
    slug: 'around-the-world',
    title: 'Around the World in 80 Days',
    subtitle: 'Jules Verne · 1872',
    description: 'Phileas Fogg bets he can circumnavigate the globe in 80 days — a thrilling Victorian race against time.',
    tradition: 'Adventure',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/103/pg103.txt',
    colorClass: 'text-amber-500',
    defaultCoverUrl: '/classics/around-the-world.svg',
    coverPrompt: 'Around the World in 80 Days by Jules Verne. A colourful hot air balloon over Victorian London, a proper English gentleman with a pocket watch, exotic destinations collaged behind — India, Japan, America — warm adventurous tones.',
  },
  {
    slug: 'time-machine',
    title: 'The Time Machine',
    subtitle: 'H.G. Wells · 1895',
    description: 'A Victorian inventor travels to the far future and discovers the fate of humanity in this pioneering sci-fi novella.',
    tradition: 'Sci-Fi',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/35/pg35.txt',
    colorClass: 'text-emerald-600',
    defaultCoverUrl: '/classics/time-machine.svg',
    coverPrompt: 'The Time Machine by H.G. Wells. A brass and crystal time machine spinning through swirling temporal vortex, Victorian inventor at the controls, ethereal green and gold light trails, clockwork gears dissolving into the future.',
  },
  // Epic Poetry
  {
    slug: 'odyssey',
    title: 'The Odyssey',
    subtitle: 'Homer · Samuel Butler Translation',
    description: "Odysseus's ten-year sea voyage home from Troy — monsters, gods, and the longing for home.",
    tradition: 'Epic Poetry',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/1727/pg1727.txt',
    colorClass: 'text-blue-400',
    defaultCoverUrl: '/classics/odyssey.svg',
    coverPrompt: 'The Odyssey by Homer. Odysseus bound to the mast of a ship sailing past the Sirens on a tempestuous wine-dark Aegean sea, ancient Greek gods watching from clouds above, classical terracotta and azure blue painting style.',
  },
  // Philosophy
  {
    slug: 'meditations',
    title: 'Meditations',
    subtitle: 'Marcus Aurelius · George Long Translation',
    description: 'Private philosophical reflections of a Roman emperor — the Stoic masterpiece on virtue, reason, and the good life.',
    tradition: 'Stoicism',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/2680/pg2680.txt',
    colorClass: 'text-stone-500',
    defaultCoverUrl: '/classics/meditations.svg',
    coverPrompt: 'Meditations by Marcus Aurelius. A Roman emperor in armour seated alone at dusk, writing by oil lamp in a military tent, the Pantheon visible through the opening, marble and parchment textures, muted gold and stone tones.',
  },
  {
    slug: 'the-republic',
    title: 'The Republic',
    subtitle: 'Plato · Benjamin Jowett Translation',
    description: "Plato's dialogue on justice, the ideal state, and the philosopher-king — cornerstone of Western philosophy.",
    tradition: 'Philosophy',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/1497/pg1497.txt',
    colorClass: 'text-indigo-500',
    defaultCoverUrl: '/classics/the-republic.svg',
    coverPrompt: 'The Republic by Plato. The Allegory of the Cave — silhouettes chained in a cave watching shadows on a wall, bright sunlight at the cave entrance, classical Greek columns, mosaic and fresco style, deep blue and gold.',
  },
  {
    slug: 'art-of-war',
    title: 'The Art of War',
    subtitle: 'Sun Tzu · Lionel Giles Translation',
    description: 'The ancient Chinese military treatise on strategy, deception, and victory without battle.',
    tradition: 'Philosophy',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/132/pg132.txt',
    colorClass: 'text-red-600',
    defaultCoverUrl: '/classics/art-of-war.svg',
    coverPrompt: 'The Art of War by Sun Tzu. Ancient Chinese generals on horseback surveying a misty battlefield from a hilltop, traditional ink brush painting, bamboo scroll unfurling, imperial red and black, Chinese calligraphy.',
  },
  {
    slug: 'the-prince',
    title: 'The Prince',
    subtitle: 'Machiavelli · N.H. Thomson Translation',
    description: "Machiavelli's ruthlessly pragmatic guide to political power — the original handbook of realpolitik.",
    tradition: 'Philosophy',
    gutenbergUrl: 'https://www.gutenberg.org/cache/epub/1232/pg1232.txt',
    colorClass: 'text-zinc-600',
    defaultCoverUrl: '/classics/the-prince.svg',
    coverPrompt: 'The Prince by Machiavelli. A Renaissance Florentine court scene — a shrewd nobleman at a chess board, political maps spread before him, Renaissance palace interior, chessboard motif, rich crimson and dark marble tones.',
  },
  // Mathematics
  {
    slug: 'euclid-elements',
    title: "Euclid's Elements",
    subtitle: 'Euclid · c.300 BC',
    description: 'The foundational text of mathematics — 13 books of geometry, number theory, and rigorous logical proof.',
    tradition: 'Mathematics',
    gutenbergUrl: 'https://www.gutenberg.org/files/21076/21076-h/21076-h.htm',
    colorClass: 'text-teal-600',
    defaultCoverUrl: '/classics/euclid-elements.svg',
    coverPrompt: "Euclid's Elements. Perfect geometric constructions — circles, triangles, and golden ratio spirals drawn with compass and straightedge on aged parchment, ancient Greek mathematical diagrams, precise lines, ivory and teal ink.",
    articleType: 'math_textbook',
  },
  {
    slug: 'calculus-made-easy',
    title: 'Calculus Made Easy',
    subtitle: 'Silvanus Thompson · 1914',
    description: '"What one fool can do, another can." The most readable introduction to calculus ever written.',
    tradition: 'Mathematics',
    gutenbergUrl: 'https://www.gutenberg.org/files/33283/33283-t/33283-t.tex',
    colorClass: 'text-teal-500',
    defaultCoverUrl: '/classics/calculus-made-easy.svg',
    coverPrompt: 'Calculus Made Easy by Silvanus Thompson. A playful chalkboard covered in elegant calculus equations and smooth curves, integral signs and derivatives drawn with chalk, warm classroom light, mathematical beauty made approachable.',
    articleType: 'math_textbook',
  },
]

/** Strip the Project Gutenberg header and footer from plain-text files. */
export function stripGutenberg(text: string): string {
  const startRe = /\*{3}\s*START OF (THE |THIS )?PROJECT GUTENBERG[^\n]*/i
  const startMatch = text.match(startRe)
  if (startMatch) {
    const idx = text.indexOf(startMatch[0])
    text = text.slice(idx + startMatch[0].length).replace(/^\s*\n+/, '')
  }

  const endRe = /\*{3}\s*END OF (THE |THIS )?PROJECT GUTENBERG[^\n]*/i
  const endMatch = text.match(endRe)
  if (endMatch) {
    const idx = text.indexOf(endMatch[0])
    text = text.slice(0, idx).trim()
  }

  return text.trim()
}
