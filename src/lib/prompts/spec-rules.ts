/**
 * Spec Sheet Rules - OWM API から移植 + ガーメントオンリー拡張
 */

// === 人物モデル版ルール（ヒーローショット用） ===

export const SIDE_VIEW_ANATOMY_RULES = `
[SIDE VIEW ANATOMY - CRITICAL - ABSOLUTE REQUIREMENT]
For the CENTER SIDE VIEW panel:
- The model's nose MUST point to the RIGHT side of the image
- The model's toes MUST point to the RIGHT side of the image
- The heel MUST be on the LEFT side, toes on the RIGHT side
- Body and feet MUST face the SAME direction (both pointing RIGHT)
- Do NOT mirror or reverse the feet direction
- VERIFY: Before finalizing, confirm that in the SIDE VIEW panel, nose, chest, knees, and toes ALL point to the RIGHT
- FORBIDDEN: Feet pointing LEFT while head points RIGHT
- FORBIDDEN: Feet facing a different direction from the face
`.trim();

export const SINGLE_FIGURE_RULES = `
[SINGLE FIGURE - ABSOLUTE REQUIREMENT]
- Each panel MUST contain EXACTLY ONE full-body figure, centered in the panel
- The ENTIRE image must show only ONE person across all panels
- FORBIDDEN: Multiple figures, partial duplicates, ghost images, or overlapping bodies
- FORBIDDEN: Any second person, shadow figure, or reflection that resembles another body
- FORBIDDEN: Misaligned or shifted figures between panels
`.trim();

export const SPEC_BACKGROUND_RULES = `
[BACKGROUND - ABSOLUTE REQUIREMENT]
Background: Clean neutral studio background (white or light grey).
BACKGROUND OVERRIDE: Regardless of any mood, atmosphere, or setting keywords in the design specification,
this spec sheet MUST use a clean neutral studio background. Environmental, outdoor, textured, or colored
backgrounds are FORBIDDEN in this spec sheet. Background instructions from the user apply ONLY to the
hero portrait shot, not to this technical spec sheet.
`.trim();

// === ガーメントオンリー版ルール ===

export const GARMENT_ONLY_RULES = `
[GARMENT ONLY - ABSOLUTE REQUIREMENT]
- NO human model, NO mannequin visible, NO hanger, NO person
- The garment must be the SOLE subject of each panel
- FORBIDDEN: Any human body parts (hands, arms, legs, feet, head, face)
- FORBIDDEN: Visible mannequin neck, torso, or any mannequin hardware
- FORBIDDEN: Clothing tags, price tags, or retail labels
- The garment must appear in its natural 3D form as if being worn by an invisible body
`.trim();

export const GHOST_MANNEQUIN_RULES = `
[GHOST MANNEQUIN / INVISIBLE MANNEQUIN STYLE]
- Display the garment as if worn on a completely invisible mannequin
- The garment must maintain its natural 3D shape, volume, and drape
- Sleeves should hang naturally or be slightly posed
- Collar and neckline should maintain their structural form
- The garment appears to float in space, maintaining its worn shape
- Show the natural fall and movement of the fabric
- Interior construction (lining, inner seams) should be visible at openings
- Maintain consistent lighting and shadow to reinforce 3D form
`.trim();

export const FLAT_LAY_RULES = `
[FLAT LAY STYLE]
- The garment is laid flat on a clean white surface
- Shot from directly above (bird's eye / top-down view)
- The garment is neatly arranged and symmetrically positioned
- Sleeves are spread out to show full shape
- Collar is arranged to show its natural form
- All buttons/zippers are in their natural position
- The garment fills most of the frame
- No wrinkles or creases (unless intentional design detail)
- Even, shadowless lighting from above
`.trim();

export const GARMENT_CONSISTENCY_RULES = `
[CRITICAL CONSISTENCY]
- The garment MUST be IDENTICAL in material, color, and design details across all views
- Fabric texture, weight, and drape must be consistent
- All construction details (seams, pockets, closures) must match across views
- Color must be perfectly matched across all panels
- Scale and proportion must be consistent
`.trim();

export const CLEAN_IMAGE_RULES = `
[CLEAN IMAGE RULES - CRITICAL]
- NO TEXT. NO LABELS. NO TYPOGRAPHY. NO WATERMARKS.
- DO NOT write "FRONT", "SIDE", "BACK" or any other text on the image.
- Keep the background completely clean, empty, and free of any writing or symbols.
- NO logos, NO brand names, NO signatures, NO captions.
`.trim();

export const LOGO_PROHIBITION = `
[LOGO & BRAND PROHIBITION - ABSOLUTE]
- ZERO TOLERANCE for ANY logos, symbols, or brand identifiers
- NO letters, initials, or monograms that could represent a brand
- NO recognizable brand patterns (monogram prints, signature patterns, iconic motifs)
- ALL patterns must be completely ORIGINAL abstract designs
- If a pattern looks like it could belong to ANY existing fashion house, DO NOT USE IT
- Replace any brand-like elements with: solid colors, abstract textures, original geometric patterns, or natural material textures
`.trim();
