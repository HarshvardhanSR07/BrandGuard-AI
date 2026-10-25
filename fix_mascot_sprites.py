import os
from PIL import Image
import numpy as np
from scipy import ndimage

def clean_cell_background(cell_img):
    """
    Flood-fill background removal starting ONLY from the outer edges.
    Preserves 100% of the mascot's white face, forehead, and belly!
    """
    arr = np.array(cell_img.convert('RGBA'))
    h, w = arr.shape[:2]
    
    # White background threshold: r, g, b > 230
    white_mask = (arr[..., 0] > 225) & (arr[..., 1] > 225) & (arr[..., 2] > 225)
    
    # Label connected components of white pixels
    labeled_white, num_features = ndimage.label(white_mask)
    
    # Find which labels touch the outer boundary of the cell
    edge_labels = set()
    edge_labels.update(labeled_white[0, :].ravel())       # top edge
    edge_labels.update(labeled_white[-1, :].ravel())      # bottom edge
    edge_labels.update(labeled_white[:, 0].ravel())       # left edge
    edge_labels.update(labeled_white[:, -1].ravel())      # right edge
    edge_labels.discard(0)  # 0 is non-white
    
    # Background mask is ONLY white components that touch the edge
    is_outer_bg = np.isin(labeled_white, list(edge_labels))
    
    # Create smooth anti-aliased edge
    alpha = np.ones((h, w), dtype=np.uint8) * 255
    alpha[is_outer_bg] = 0
    
    # Slight feathering on the 1-pixel boundary
    dist_map = ndimage.distance_transform_edt(~is_outer_bg)
    feather = np.clip(dist_map * 255, 0, 255).astype(np.uint8)
    alpha = np.where(is_outer_bg, 0, np.minimum(alpha, feather))
    
    arr[..., 3] = alpha
    return Image.fromarray(arr, 'RGBA')

def process_sprite_sheet(raw_path, out_path, is_directions=False):
    img = Image.open(raw_path)
    w, h = img.size
    cw, ch = w // 3, h // 3
    
    out_atlas = Image.new('RGBA', (1080, 1080), (0, 0, 0, 0))
    
    # For directions:
    # DIRECTIONS array in Mascot.tsx:
    # 0: up-left,   1: up,     2: up-right
    # 3: left,      4: center, 5: right
    # 6: down-left, 7: down,   8: down-right
    #
    # In lax_directions_raw_1792898221573.jpg:
    # The AI drew:
    # Col 0 = right-facing (stage right / viewer right)
    # Col 1 = center
    # Col 2 = left-facing (stage left / viewer left)
    # So to map to DIRECTIONS:
    # Col 0 (left-facing) should come from raw col 2
    # Col 1 (center) should come from raw col 1
    # Col 2 (right-facing) should come from raw col 0
    
    for r in range(3):
        for c in range(3):
            if is_directions:
                src_c = 2 - c  # swap col 0 and 2 so viewer-left is in col 0 and viewer-right is in col 2
            else:
                src_c = c
                
            src_cell = img.crop((src_c * cw, r * ch, (src_c + 1) * cw, (r + 1) * ch))
            src_cell = src_cell.resize((360, 360), Image.Resampling.LANCZOS)
            
            cleaned = clean_cell_background(src_cell)
            out_atlas.paste(cleaned, (c * 360, r * 360), cleaned)
            
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    out_atlas.save(out_path, 'WEBP', quality=95)
    print(f"Saved cleaned atlas to {out_path}")

dir_raw = 'C:/Users/Harsh/.gemini/antigravity/brain/9fd3a843-8b8b-44bd-9d2c-a92de68566fa/lax_directions_raw_1792898221573.jpg'
react_raw = 'C:/Users/Harsh/.gemini/antigravity/brain/9fd3a843-8b8b-44bd-9d2c-a92de68566fa/lax_reactions_raw_1792898285480.jpg'

dir_out = 'c:/Users/Harsh/.gemini/antigravity/scratch/BrandGuardAI/apps/web/public/mascots/lax-directions.webp'
react_out = 'c:/Users/Harsh/.gemini/antigravity/scratch/BrandGuardAI/apps/web/public/mascots/lax-reactions.webp'

process_sprite_sheet(dir_raw, dir_out, is_directions=True)
process_sprite_sheet(react_raw, react_out, is_directions=False)
