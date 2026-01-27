/**
 * Garment Spec Sheet Prompts - ガーメント単体3面図
 * ゴーストマネキン / フラットレイ の2スタイル対応
 */

import {
  GARMENT_ONLY_RULES,
  GHOST_MANNEQUIN_RULES,
  FLAT_LAY_RULES,
  GARMENT_CONSISTENCY_RULES,
  CLEAN_IMAGE_RULES,
  LOGO_PROHIBITION,
} from './spec-rules';

/**
 * ゴーストマネキンスタイルの3面図プロンプト
 * 服が立体的に見える、人物なし
 */
export function buildGhostMannequinPrompt(designPrompt: string): string {
  return `
Create a photorealistic GARMENT PRODUCT PHOTOGRAPHY sheet.
Format: Horizontal Triptych (3 side-by-side panels) with Aspect Ratio 16:9.

[PHOTOGRAPHY STYLE]
Ghost mannequin / invisible mannequin product photography.
The garment is displayed as if worn on a completely invisible body.
Professional e-commerce product photography quality.

${GHOST_MANNEQUIN_RULES}

${GARMENT_ONLY_RULES}

[LAYOUT REQUIREMENTS]
The image must be split into 3 vertical sections:
- LEFT: FRONT VIEW (Garment facing camera, showing front design)
- CENTER: SIDE VIEW (90-degree profile view, showing garment depth and silhouette)
- RIGHT: BACK VIEW (Garment back facing camera, showing back design)

[FRAMING & COMPOSITION]
- Camera Distance: Full garment visible with generous padding
- TOP: Leave 10% empty space above the garment
- BOTTOM: Leave 10% empty space below the garment hem
- VISUAL SEPARATION: Use thin white lines to separate the three panels
- Each panel must show the COMPLETE garment from collar/neckline to hem
- Center the garment in each panel

${GARMENT_CONSISTENCY_RULES}

${CLEAN_IMAGE_RULES}

${LOGO_PROHIBITION}

[DESIGN SPECIFICATIONS - MATCH THIS EXACTLY]
${designPrompt}

[QUALITY]
- Hyper-realistic fabric texture, visible stitching, construction details
- 8K resolution, professional studio lighting
- Clean white background with subtle shadow for depth
- E-commerce product photography standard
- The image must look like a PHOTOGRAPH of a real garment, not a 3D render or illustration

Negative: text, label, word, writing, signature, watermark, typography, human, person, face, hands, feet, mannequin visible, hanger, 3D render, illustration, painting, drawing, ANY logo, ANY brand name, ANY monogram
  `.trim();
}

/**
 * フラットレイスタイルの3面図プロンプト
 * 平置き撮影スタイル
 */
export function buildFlatLayPrompt(designPrompt: string): string {
  return `
Create a photorealistic GARMENT FLAT LAY PHOTOGRAPHY sheet.
Format: Horizontal Triptych (3 side-by-side panels) with Aspect Ratio 16:9.

[PHOTOGRAPHY STYLE]
Professional flat lay / overhead product photography.
The garment is laid flat on a clean white surface and photographed from directly above.

${FLAT_LAY_RULES}

${GARMENT_ONLY_RULES}

[LAYOUT REQUIREMENTS]
The image must be split into 3 vertical sections:
- LEFT: FRONT VIEW (Garment front facing up, neatly arranged)
- CENTER: DETAIL VIEW (Close-up of key design details: fabric texture, stitching, closure, or pattern)
- RIGHT: BACK VIEW (Garment back facing up, neatly arranged)

[FRAMING & COMPOSITION]
- Camera Angle: Directly overhead (bird's eye view) for LEFT and RIGHT panels
- CENTER panel: Slightly angled close-up showing texture and construction details
- Each panel must show the garment clearly with clean white background
- VISUAL SEPARATION: Use thin white lines to separate the three panels
- Generous padding around each garment

${GARMENT_CONSISTENCY_RULES}

${CLEAN_IMAGE_RULES}

${LOGO_PROHIBITION}

[DESIGN SPECIFICATIONS - MATCH THIS EXACTLY]
${designPrompt}

[QUALITY]
- Hyper-realistic fabric texture, visible weave/knit structure
- 8K resolution, even overhead lighting (no harsh shadows)
- Clean white background, product photography standard
- The image must look like a PHOTOGRAPH of a real garment, not a 3D render or illustration

Negative: text, label, word, writing, signature, watermark, typography, human, person, face, hands, feet, mannequin, hanger, 3D render, illustration, painting, drawing, ANY logo, ANY brand name, ANY monogram, wrinkled, messy
  `.trim();
}
