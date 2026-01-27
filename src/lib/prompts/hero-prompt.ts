/**
 * Hero Shot Prompt Builder - OWM API から移植・適応
 * 8種のスタイルから自動選択、クールダウン機能付き
 */

// ============================================================================
// STYLE COOLDOWN MANAGEMENT
// ============================================================================

const globalStyleHistory: string[] = [];
const STYLE_HISTORY_SIZE = 8;
const COOLDOWN_FACTOR = 0.1; // 90% reduction per recent use

// ============================================================================
// BACKGROUND VARIATIONS
// ============================================================================

const STUDIO_BACKGROUNDS = [
  'Warm beige seamless paper background, soft diffused lighting',
  'Soft cream studio cyclorama, gentle shadows',
  'Light gray infinity cove, even lighting with subtle rim light',
  'Pale blush pink backdrop, soft and flattering light',
  'Warm taupe textured wall, natural light from large window',
  'Off-white plaster wall with subtle texture, golden hour glow',
  'Dove gray canvas backdrop, classic studio lighting',
  'Sand-colored linen backdrop, warm ambient light',
];

const URBAN_BACKGROUNDS = [
  'Paris Haussmann building facade, morning light on limestone',
  'Tokyo Omotesando avenue, clean architectural luxury storefronts',
  'New York SoHo cobblestone street, industrial cast-iron buildings',
  'London Shoreditch brick alley, overcast diffused light',
  'Milan via della Spiga, elegant storefronts and marble',
  'Berlin Mitte concrete and glass, stark modernist architecture',
  'Seoul Gangnam district, sleek glass towers and urban energy',
  'Barcelona Gothic Quarter, ancient stone walls and dramatic shadows',
  'Los Angeles downtown arts district, murals and warehouse facades',
  'Amsterdam canal bridge, golden light reflecting on water',
];

const MOODY_STUDIO_BACKGROUNDS = [
  'Deep burgundy velvet curtain backdrop, single spotlight',
  'Forest green painted wall, dramatic chiaroscuro lighting',
  'Midnight purple seamless, rim lighting creating silhouette edge',
  'Warm amber-lit space, candle-like glow with deep shadows',
  'Charcoal gray textured concrete, harsh directional light',
  'Deep navy backdrop, cool blue-tinted rim light',
  'Oxblood leather-textured wall, warm theatrical lighting',
  'Black void with single overhead spotlight, high contrast',
];

const NATURE_BACKGROUNDS = [
  'Golden wheat field at sunset, warm backlight through stalks',
  'Misty forest clearing, soft diffused morning light',
  'Desert sand dunes at golden hour, long shadows',
  'Rocky coastal cliff, dramatic ocean backdrop',
  'Botanical garden greenhouse, filtered green light',
  'Lavender field in Provence, purple haze and golden light',
  'Japanese bamboo grove, dappled light through leaves',
  'Snow-covered pine forest, crisp winter light',
  'Mediterranean olive grove, warm afternoon sun',
  'Scottish highland moorland, moody overcast sky',
];

const ARCHITECTURAL_BACKGROUNDS = [
  'Concrete brutalist building, geometric shadows',
  'Glass skyscraper reflection, modern urban canyon',
  'White marble museum atrium, natural skylight',
  'Industrial warehouse with steel beams, dramatic light shafts',
  'Modernist pavilion, clean lines and open space',
  'Art deco building entrance, geometric patterns',
  'Japanese temple wooden corridor, zen minimalism',
  'Contemporary art museum exterior, bold angular forms',
  'Historic library with tall bookshelves, warm wood tones',
  'Abandoned factory with large windows, raw industrial beauty',
];

const COLORED_STUDIO_BACKGROUNDS = [
  'Rich cobalt blue seamless paper, controlled studio lighting',
  'Dusty rose backdrop, refined feminine elegance',
  'Deep emerald green studio wall, jewel-tone sophistication',
  'Burnt sienna seamless, warm editorial richness',
  'Saffron yellow background, luxurious warmth',
  'Soft lavender backdrop, quiet pastel refinement',
  'Terracotta studio, earthy Mediterranean luxury',
  'Teal blue-green backdrop, sophisticated depth',
  'Burgundy seamless, deep couture elegance',
  'Sage green wall, understated contemporary polish',
];

const VINTAGE_TEXTURED_BACKGROUNDS = [
  'Peeling paint wall in muted colors, film grain aesthetic',
  'Vintage hotel room with faded wallpaper, nostalgic mood',
  'Weathered wooden barn interior, rustic warmth',
  'Old theater with velvet curtains, theatrical drama',
  '1970s living room with period furniture, retro vibe',
  'Abandoned mansion with ornate details, faded grandeur',
  'Old bookshop with dusty shelves, intellectual charm',
  'Vintage train compartment, romantic travel mood',
];

const INTERIOR_BACKGROUNDS = [
  'Art gallery white cube, pristine and focused',
  'Loft with exposed brick and industrial pipes, urban chic',
  'Rooftop terrace at golden hour, sophisticated city backdrop',
  'Museum atrium with dramatic skylight, architectural elegance',
  'Historic mansion staircase, dramatic sculptural shadows',
  'Modernist pavilion with clean glass walls, minimalist luxury',
  'Theater backstage with velvet drapes, dramatic atmosphere',
  "Artist's studio with large windows, creative workspace light",
];

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================================
// HERO STYLES
// ============================================================================

export const HERO_STYLES = {
  LOOKBOOK_CLEAN: {
    name: 'MODERN MINIMALIST',
    getDescription: () =>
      `${randomPick(STUDIO_BACKGROUNDS)}. (Celine/Jil Sander/The Row aesthetic)`,
    camera: '50mm portrait lens. Vertical framing. Eye-level or slightly below.',
    pose: 'Relaxed confidence. Walking towards camera, hand in pocket, or slight lean. NOT a stiff mannequin pose.',
    vibe: 'Sophisticated, Expensive, Clean.',
  },
  URBAN_DAYLIGHT: {
    name: 'HIGH-END STREET SNAP',
    getDescription: () =>
      `${randomPick(URBAN_BACKGROUNDS)}. Natural daylight. (Balenciaga/Vetements aesthetic)`,
    camera: '35mm lens. Low angle looking up (Vertical shot). Slight motion blur on extremities.',
    pose: 'Confident walking stride. Caught in motion. Fabric flowing in wind. Looking away or sunglasses.',
    vibe: 'Raw, Cool, Candid.',
  },
  EDITORIAL_DRAMA: {
    name: 'DARK ROMANTIC',
    getDescription: () =>
      `${randomPick(MOODY_STUDIO_BACKGROUNDS)}. Deep shadows (Chiaroscuro). (Saint Laurent/Alexander McQueen aesthetic)`,
    camera: '85mm lens. Focus on texture. Vertical magazine cover composition. Sharp focus on face/outfit, bokeh background.',
    pose: 'Dramatic, theatrical power stance. Looking back over shoulder, sitting on a chair, or strong stance.',
    vibe: 'Mysterious, Intense, Cinematic.',
  },
  NATURE_EDITORIAL: {
    name: 'OUTDOOR ORGANIC',
    getDescription: () =>
      `${randomPick(NATURE_BACKGROUNDS)}. (Gabriela Hearst/Loro Piana aesthetic)`,
    camera: '85mm portrait lens. Shallow depth of field. Natural light.',
    pose: 'Contemplative, at ease with surroundings. Standing, walking slowly, or seated on natural element.',
    vibe: 'Earthy, Serene, Luxurious.',
  },
  ARCHITECTURAL: {
    name: 'BRUTALIST MODERN',
    getDescription: () =>
      `${randomPick(ARCHITECTURAL_BACKGROUNDS)}. Geometric composition. (Acne Studios/Bottega aesthetic)`,
    camera: '28mm wide angle. Strong geometric lines framing the subject. Vertical composition.',
    pose: 'Standing confidently against architecture. Using space and lines. Angular body position.',
    vibe: 'Bold, Structural, Contemporary.',
  },
  POP_COLOR: {
    name: 'COLOR EDITORIAL',
    getDescription: () =>
      `${randomPick(COLORED_STUDIO_BACKGROUNDS)}. (Valentino/Loewe/Versace aesthetic)`,
    camera: '50mm portrait lens. Clean vertical composition. Sharp focus on subject against color backdrop.',
    pose: 'Poised and composed. Standing with elegant posture, slight weight shift, or refined hand placement.',
    vibe: 'Vibrant, Polished, Contemporary.',
  },
  RAW_FILM: {
    name: 'ANALOG ART',
    getDescription: () =>
      `Shot on Kodak Portra 400. Film grain, light leaks. ${randomPick(VINTAGE_TEXTURED_BACKGROUNDS)}. (Maison Margiela/Yohji Yamamoto aesthetic)`,
    camera: '35mm film camera. Handheld feel. Vertical snapshot. Maybe slightly soft focus or motion blurred.',
    pose: 'Introverted, hunched, or turning away. Capturing a mood rather than just the cloth.',
    vibe: 'Artistic, Melancholic, Authentic.',
  },
  INTERIOR_LUXE: {
    name: 'ARCHITECTURAL INTERIOR',
    getDescription: () =>
      `${randomPick(INTERIOR_BACKGROUNDS)}. (Toteme/Lemaire aesthetic)`,
    camera: '50mm lens. Subject framed within architectural elements. Vertical composition.',
    pose: 'Editorial moment: walking through doorway, leaning against wall, seated elegantly. Natural and confident.',
    vibe: 'Intimate, Refined, Artistic.',
  },
} as const;

export type HeroStyleKey = keyof typeof HERO_STYLES;

// ============================================================================
// CONTEXTUAL STYLE SELECTION
// ============================================================================

const STYLE_AFFINITIES: Record<HeroStyleKey, string[]> = {
  LOOKBOOK_CLEAN: [
    'minimal', 'minimalist', 'clean', 'tailored', 'simple', 'elegant',
    'understated', 'refined', 'classic', 'monochrome', 'neutral',
    'structured', 'basic', 'wardrobe', 'staple', 'timeless', 'quiet luxury',
  ],
  URBAN_DAYLIGHT: [
    'street', 'urban', 'city', 'modern', 'tech',
    'contemporary', 'denim', 'casual', 'sneaker', 'hoodie', 'sporty',
    'streetwear', 'tokyo', 'new york', 'rain', 'night', 'alley',
  ],
  EDITORIAL_DRAMA: [
    'dark', 'dramatic', 'gothic', 'romantic', 'noir', 'mysterious',
    'evening', 'luxe', 'velvet', 'silk', 'gown', 'black', 'shadow',
    'melancholy', 'intense', 'sensual', 'couture', 'opulent',
  ],
  NATURE_EDITORIAL: [
    'organic', 'natural', 'earthy', 'botanical', 'floral', 'linen',
    'cotton', 'summer', 'beach', 'garden', 'green', 'flowing',
    'breeze', 'pastoral', 'resort', 'tropical', 'forest', 'meadow',
  ],
  ARCHITECTURAL: [
    'structural', 'geometric', 'angular', 'brutalist', 'avant-garde',
    'deconstructed', 'asymmetric', 'futuristic', 'sharp', 'rigid',
    'concrete', 'industrial', 'monolith', 'oversize', 'volume',
  ],
  POP_COLOR: [
    'colorful', 'vibrant', 'bold', 'color', 'pop', 'bright',
    'vivid', 'pattern', 'print', 'saturated', 'jewel',
    'rich', 'statement', 'expressive', 'graphic', 'chromatic', 'pigment',
  ],
  RAW_FILM: [
    'vintage', 'retro', 'nostalgic', 'film', 'analog', 'worn',
    'distressed', 'grunge', 'melancholic', '70s', '80s', '90s',
    'faded', 'washed', 'denim', 'leather', 'bohemian', 'artisan',
  ],
  INTERIOR_LUXE: [
    'luxury', 'interior', 'sophisticated', 'museum', 'gallery',
    'haute', 'atelier', 'bespoke', 'tailoring', 'silk', 'cashmere',
    'evening wear', 'formal', 'gala', 'cocktail', 'lounge',
  ],
};

const AFFINITY_BOOST = 3.0;

function countAffinityMatches(designPrompt: string, keywords: string[]): number {
  const lower = designPrompt.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw)).length;
}

function selectHeroStyleWithWeights(
  affinityScores?: Partial<Record<HeroStyleKey, number>>
): HeroStyleKey {
  const styleKeys = Object.keys(HERO_STYLES) as HeroStyleKey[];
  const weights: Array<{ key: HeroStyleKey; weight: number }> = [];

  for (const key of styleKeys) {
    let weight = 1.0;

    const recentIndex = globalStyleHistory.indexOf(key);
    if (recentIndex !== -1) {
      const penalty = Math.pow(COOLDOWN_FACTOR, 1 - recentIndex / STYLE_HISTORY_SIZE);
      weight *= penalty;
    }

    if (affinityScores && affinityScores[key]) {
      const matchCount = affinityScores[key]!;
      const boost = Math.min(AFFINITY_BOOST * matchCount, AFFINITY_BOOST * 2);
      weight *= boost;
    }

    weights.push({ key, weight });
  }

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const rand = Math.random() * totalWeight;
  let cumulative = 0;

  for (const { key, weight } of weights) {
    cumulative += weight;
    if (rand <= cumulative) {
      globalStyleHistory.unshift(key);
      if (globalStyleHistory.length > STYLE_HISTORY_SIZE) {
        globalStyleHistory.pop();
      }
      return key;
    }
  }

  const fallback = styleKeys[0];
  globalStyleHistory.unshift(fallback);
  return fallback;
}

export function selectContextualHeroStyle(designPrompt: string): HeroStyleKey {
  const affinityScores: Partial<Record<HeroStyleKey, number>> = {};
  let hasAnyMatch = false;

  for (const [key, keywords] of Object.entries(STYLE_AFFINITIES)) {
    const matches = countAffinityMatches(designPrompt, keywords);
    if (matches > 0) {
      affinityScores[key as HeroStyleKey] = matches;
      hasAnyMatch = true;
    }
  }

  if (!hasAnyMatch) {
    return selectHeroStyleWithWeights();
  }

  return selectHeroStyleWithWeights(affinityScores);
}

// ============================================================================
// HERO PROMPT BUILDER
// ============================================================================

export function constructHeroPrompt(
  designPrompt: string,
  styleKey?: HeroStyleKey
): { prompt: string; styleName: string; styleKey: HeroStyleKey; backgroundDescription: string } {
  const selectedKey = styleKey || selectContextualHeroStyle(designPrompt);
  const style = HERO_STYLES[selectedKey];
  const backgroundDescription = style.getDescription();

  const prompt = `
[ROLE]
World-class High-Fashion Photographer & Art Director.

[TASK]
Create a High-Fashion Editorial Portrait.
**OUTPUT FORMAT: 9:16 Vertical (Full Screen Mobile)** - This ratio is mandatory.

[CRITICAL: COMPOSITION OVERRIDE - READ CAREFULLY]
The input reference image is a design concept.
You must handle it as follows:

1. DESIGN (Clothing/Face): **STRICTLY FOLLOW** the input image.
   - The outfit details (color, material, silhouette, patterns) MUST be identical to the reference.
   - The model's face and body type should be appropriate for the design aesthetic.

2. COMPOSITION (Pose/Angle): **COMPLETELY IGNORE** any static layout from reference.
   - DO NOT generate a split screen or collage.
   - DO NOT generate a T-pose, A-pose, or stiff mannequin stance.
   - DO NOT include any text or labels.
   - Generate ONE single, full-screen, artistic shot of the character.

[ART DIRECTION: ${style.name}]
- BACKGROUND/LIGHTING: ${backgroundDescription}
- CAMERA/LENS: ${style.camera}
- POSE/ACTION: ${style.pose}
- MOOD: ${style.vibe}

[BACKGROUND DIVERSITY - CRITICAL]
- AVOID repetitive solid blue or monotone backgrounds
- Each generation should feel UNIQUE in its environment
- Match the background to the garment's mood

[COMPLETE OUTFIT STYLING]
- Show a FULL coordinated look, not just the main garment
- Include appropriate innerwear visible at neckline
- Show stylish footwear that matches the outfit's vibe
- Include accessories where appropriate: belt, bag, scarf, watch, jewelry

[SUBJECT DESIGN SPECIFICATIONS - STRICT ADHERENCE]
${designPrompt}

[FRAMING REQUIREMENTS - 9:16 VERTICAL]
- Fill the vertical frame completely with the character and background.
- HEADROOM: Leave 10-15% space above the head.
- FOOTROOM: Show full feet with ground shadow.
- The character should be the dominant element.

[QUALITY CONTROL]
- Photorealistic skin texture (pores, subtle imperfections).
- Tangible fabric texture (weight, flow, material properties).
- Cinematic lighting suitable for a vertical smartphone screen.
- The image must look like a PHOTOGRAPH, not a 3D render or illustration.

[NEGATIVE PROMPTS - AVOID]
- Static T-pose or A-pose
- Split screen / multiple views / collage
- Text, labels, watermarks
- Generic stock photo look
- Stiff, unnatural pose
- 3D render look / CGI appearance
- ANY logos, brand symbols, or brand identifiers whatsoever
- ANY monogram patterns, interlocking letters, or repeated initials
- ABSOLUTELY NO magazine titles, publication names, or text overlays
- Missing lower body / no pants / incomplete outfit
  `.trim();

  return {
    prompt,
    styleName: style.name,
    styleKey: selectedKey,
    backgroundDescription,
  };
}
