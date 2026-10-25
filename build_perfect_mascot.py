import os
from PIL import Image
import numpy as np
from scipy import ndimage

def clean_cell_transparent(cell_img):
    """
    Remove white background while guaranteeing that 100% of the mascot
    (face, eyes, cheeks, forehead star, belly, clothing) remains completely solid opaque.
    """
    arr = np.array(cell_img.convert('RGBA'))
    h, w = arr.shape[:2]

    # Threshold for white background
    # Background in the raw generation is clean white (r, g, b > 215)
    white_mask = (arr[..., 0] > 215) & (arr[..., 1] > 215) & (arr[..., 2] > 215)

    # Label connected components of white pixels
    labeled, num_features = ndimage.label(white_mask)

    # Only white pixels that are connected to the outer boundary belong to the background
    edge_labels = set(labeled[0, :]).union(labeled[-1, :]).union(labeled[:, 0]).union(labeled[:, -1])
    edge_labels.discard(0)  # 0 is non-white

    is_outer_bg = np.isin(labeled, list(edge_labels))

    # Binary fill holes: any white region enclosed by the character (face, belly) is 100% filled!
    character_solid = ndimage.binary_fill_holes(~is_outer_bg)

    # Smooth anti-aliased edge: 1-pixel transition on the outer contour
    dilated_char = ndimage.binary_dilation(character_solid, iterations=1)
    edge_pixels = dilated_char & (~character_solid)

    alpha = np.zeros((h, w), dtype=np.uint8)
    alpha[character_solid] = 255
    alpha[edge_pixels] = 160

    arr[..., 3] = alpha
    return Image.fromarray(arr, 'RGBA')

def build_calibrated_directions():
    raw_path = 'C:/Users/Harsh/.gemini/antigravity/brain/9fd3a843-8b8b-44bd-9d2c-a92de68566fa/lax_directions_raw_1792898221573.jpg'
    out_path = 'c:/Users/Harsh/.gemini/antigravity/scratch/BrandGuardAI/apps/web/public/mascots/lax-directions.webp'

    img = Image.open(raw_path)
    w, h = img.size
    cw, ch = w // 3, h // 3

    # Extract all 9 raw cells
    raw_cells = {}
    for r in range(3):
        for c in range(3):
            cell = img.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)).resize((360, 360), Image.Resampling.LANCZOS)
            raw_cells[(r, c)] = clean_cell_transparent(cell)

    # DIRECTIONS:
    # Row 0: up-left (0,0),    up (0,1),     up-right (0,2)
    # Row 1: left (1,0),       center (1,1), right (1,2)
    # Row 2: down-left (2,0),  down (2,1),   down-right (2,2)

    # In raw_cells:
    # (0, 0) is up-left
    # (0, 1) is up
    # (1, 0) is looking left
    # (1, 1) is center
    # (2, 2) is down-left
    # (2, 1) is down
    # By horizontally mirroring left-facing poses, we obtain mathematically perfect right-facing poses!
    
    calibrated_grid = [
        # Row 0: Up
        [raw_cells[(0, 0)], raw_cells[(0, 1)], raw_cells[(0, 0)].transpose(Image.FLIP_LEFT_RIGHT)],
        # Row 1: Horizontal
        [raw_cells[(1, 0)], raw_cells[(1, 1)], raw_cells[(1, 0)].transpose(Image.FLIP_LEFT_RIGHT)],
        # Row 2: Down
        [raw_cells[(2, 2)], raw_cells[(2, 1)], raw_cells[(2, 2)].transpose(Image.FLIP_LEFT_RIGHT)],
    ]

    atlas = Image.new('RGBA', (1080, 1080), (0, 0, 0, 0))
    for r in range(3):
        for c in range(3):
            cell = calibrated_grid[r][c]
            atlas.paste(cell, (c * 360, r * 360), cell)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    atlas.save(out_path, 'WEBP', quality=95)
    print("Successfully built calibrated lax-directions.webp")

def build_clean_reactions():
    raw_path = 'C:/Users/Harsh/.gemini/antigravity/brain/9fd3a843-8b8b-44bd-9d2c-a92de68566fa/lax_reactions_raw_1792898285480.jpg'
    out_path = 'c:/Users/Harsh/.gemini/antigravity/scratch/BrandGuardAI/apps/web/public/mascots/lax-reactions.webp'

    img = Image.open(raw_path)
    w, h = img.size
    cw, ch = w // 3, h // 3

    atlas = Image.new('RGBA', (1080, 1080), (0, 0, 0, 0))
    for r in range(3):
        for c in range(3):
            cell = img.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)).resize((360, 360), Image.Resampling.LANCZOS)
            cleaned = clean_cell_transparent(cell)
            atlas.paste(cleaned, (c * 360, r * 360), cleaned)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    atlas.save(out_path, 'WEBP', quality=95)
    print("Successfully built clean lax-reactions.webp")

if __name__ == '__main__':
    build_calibrated_directions()
    build_clean_reactions()
