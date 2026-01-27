/**
 * Design Vocabulary - OWM API から移植
 * デザインテクニック・美学・素材・カラーの多様性ボキャブラリ
 */

export const DESIGN_TECHNIQUE_DIVERSITY = `
[DESIGN TECHNIQUE DIVERSITY - MANDATORY]
Each generation MUST explore a DIFFERENT design approach from the following techniques.
Select ONE primary technique per generation with roughly EQUAL probability (~8% each):

1. CLEAN MINIMAL: Precise proportions, invisible seams, tonal palette, quiet sophistication
2. STRUCTURED TAILORING: Sharp shoulders, nipped waist, impeccable cut, couture finishing
3. SOFT DRAPING: Bias-cut, wrapped construction, fabric weight as primary design element
4. DECONSTRUCTED: Raw edges, exposed seams, inside-out construction, asymmetric hemlines
5. VOLUME PLAY: Exaggerated proportions, sculptural puffing, cocoon silhouettes, balloon forms
6. LAYERED COMPOSITION: Multiple visible layers creating depth, sheer over opaque, tonal stacking
7. PRECISION SPORTIF: Technical fabrics with luxury finishing, ergonomic seaming, bonded construction
8. NEO-CLASSICAL: Column silhouettes, Grecian draping, elongated lines, goddess proportions
9. UTILITARIAN LUXE: Workwear details elevated with premium materials — patch pockets, belt loops, cargo in silk/cashmere
10. TEXTURAL CONTRAST: Mixing smooth and rough, matte and shine, heavy and light within one look
11. ARCHITECTURAL CUT: Geometric pattern-cutting, origami folds, 3D construction from flat panels
12. RETRO REINTERPRETATION: Specific era silhouette (60s/70s/80s/90s) updated with modern fabric and proportion

IMPORTANT:
- Do NOT default to any single technique across multiple generations
- Mixed-material/panel designs should appear only ~15% of the time
- Each technique should produce VISUALLY DISTINCT results
`.trim();

export const CONSTRUCTION_VOCABULARY = `
[CONSTRUCTION TECHNIQUE LIBRARY]
Use specific construction terminology to create precise, varied designs:

SEAM TECHNIQUES: princess seam | French seam | flat-felled | raglan | saddle shoulder | set-in sleeve | dropped shoulder | kimono sleeve
CLOSURE TYPES: concealed placket | exposed zipper | wrap tie | toggle | hook-and-eye | magnetic snap | asymmetric button | double-breasted
COLLAR/NECKLINE: stand collar | mandarin | shawl lapel | peak lapel | notch lapel | collarless band | funnel neck | boat neck | cowl | draped neckline
HEM TREATMENTS: raw edge | lettuce hem | faced hem | asymmetric | fishtail | high-low | inverted pleat | godet insert
POCKET STYLES: welt pocket | patch pocket | hidden seam pocket | kangaroo | cargo flap | jetted | bound | inseam
WAIST DETAILS: paper-bag waist | belted | elasticated | drawstring | empire | dropped waist | peplum | corset-boned
SURFACE TECHNIQUES: pin-tucking | smocking | quilting | trapunto | ruching | gathering | knife pleating | box pleating | accordion pleating | laser-cut perforation

Apply these with SPECIFICITY — "princess-seamed bodice with box-pleated skirt" is better than "structured dress."
`.trim();

export const AESTHETIC_DIVERSITY = `
[AESTHETIC DIVERSITY - EXPLORE DIFFERENT MOODS]
Designs should span a WIDE range of aesthetics. Do not cluster around a single mood.
Consider these distinct aesthetic directions:

QUIET LUXURY: Understated elegance, invisible branding, premium touch. Warm neutrals, cashmere, raw silk.
DARK ROMANTICISM: Gothic undertones, rich textures, dramatic silhouettes. Velvet, lace, deep jewel tones.
MEDITERRANEAN EASE: Relaxed elegance, linen, natural fibers, terracotta and olive tones. Resort sophistication.
JAPANESE MINIMALISM: Wabi-sabi beauty, asymmetric balance, indigo/natural dye, clean but imperfect lines.
POWER TAILORING: Sharp authority, impeccable construction, monochromatic suiting. Broad shoulders, strong lines.
SOFT FUTURISM: Technical fabrics, bonded seams, muted metallics, ergonomic forms with organic curves.
ARTISANAL CRAFT: Hand-finished details, visible craftsmanship, embroidery, crochet, patchwork with intention.
MODERN BOHEMIAN: Layered, textured, free-spirited but refined. Earthy palettes, mixed prints with editorial restraint.
SCANDINAVIAN FUNCTION: Clean utility, padded outerwear, functional pockets, tonal palette, hygge warmth.
NEO-VICTORIAN: High collars, puffed sleeves, corsetry elements reinterpreted with modern proportions and fabrics.
COASTAL LUXE: Seafaring references, navy/white/natural, rope details, washed linens, relaxed tailoring.
BRUTALIST CHIC: Raw concrete-inspired textures, monolithic forms, muted earth tones, architectural rigidity.
`.trim();

export const FABRIC_PAIRING_VOCABULARY = `
[FABRIC INNOVATION]
Explore unexpected yet sophisticated fabric combinations:

CONTRAST PAIRINGS:
- Stiff + Fluid: Bonded neoprene bodice with silk georgette skirt
- Matte + Shine: Dry wool suiting with liquid satin lining peeking through
- Heavy + Light: Melton wool coat over sheer organza blouse
- Rough + Smooth: Raw tweed jacket with polished leather trim
- Technical + Natural: Nylon shell with cashmere knit lining

SURFACE TREATMENTS:
- Waxed cotton, rubberized silk, coated linen
- Plissé, seersucker, cloqué, jacquard, fil coupé
- Burnout velvet, devore, flocked mesh
- Stone-washed silk, enzyme-washed wool, garment-dyed leather
- Felted wool, boiled cashmere, brushed mohair

INNOVATIVE FABRICS:
- Double-face wool (two visible sides, no lining needed)
- Stretch suede, technical cashmere, silk-nylon blends
- Ribbed knit, ottoman rib, punto roma, scuba jersey
- Crinkled taffeta, paper-touch cotton, crisp poplin
- Bouclé, tweed, donegal, herringbone, houndstooth
`.trim();

export const COLOR_DIVERSITY = `
[COLOR PHILOSOPHY]
Go beyond basic color choices. Use sophisticated, specific color names:

NEUTRAL SPECTRUM: Ecru, bone, alabaster, parchment, oatmeal, greige, taupe, mushroom, stone, slate, charcoal, ink
EARTH TONES: Terracotta, sienna, umber, ochre, rust, tobacco, mahogany, walnut, espresso, cinnamon
MUTED JEWELS: Dusty emerald, faded ruby, antique gold, tarnished silver, aged amethyst, weathered sapphire
PASTELS WITH DEPTH: Dusty rose, sage, powder blue, lilac, butter, peach, seafoam, blush, mauve
RICH DARKS: Midnight navy, oxblood, forest green, aubergine, deep plum, bitter chocolate, obsidian
CONTEMPORARY: Electric cobalt, hot coral (used sparingly), acid yellow (minimal accent only), Klein blue

Color application should feel INTENTIONAL and CURATED, not random or arbitrary.
`.trim();

export const ENHANCED_DIVERSITY_RULES = `
${DESIGN_TECHNIQUE_DIVERSITY}

${CONSTRUCTION_VOCABULARY}

${AESTHETIC_DIVERSITY}

${COLOR_DIVERSITY}

${FABRIC_PAIRING_VOCABULARY}

[DIVERSITY ENFORCEMENT]
- Each generation should feel VISUALLY DISTINCT from the last
- Avoid repeating silhouettes, color palettes, or construction methods across consecutive designs
- Think like a creative director building a COLLECTION with range, not a single repeated look
- Balance commercial wearability with creative vision
- Every design should feel like it belongs in a luxury fashion magazine editorial
`.trim();
