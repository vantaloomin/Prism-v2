# Aethel Saga - Modding Guide

This guide explains how to add new card packs to Aethel Saga. The modular pack system makes it easy to add custom content without modifying any code.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Pack Structure](#pack-structure)
3. [Creating a New Pack](#creating-a-new-pack)
4. [Asset Requirements](#asset-requirements)
5. [Pack Manifest Reference](#pack-manifest-reference)
6. [Lore Data (Optional)](#lore-data-optional)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

To add a new pack, follow these steps:

1. **Create a pack folder**: `public/packs/your-pack-id/`
2. **Add a `pack.json`** manifest file with pack metadata and characters
3. **Add character images** to `characters/` subfolder
4. **Add background images** to `backgrounds/` subfolder
5. **Add a pack icon** as `pack_icon.webp`
6. **Register the pack** in `public/packs/index.json`

That's it! The game will automatically discover and load your pack.

---

## Pack Structure

Each pack is self-contained in its own folder:

```
public/packs/
├── index.json              # Lists all available packs
├── waifu/                  # Example pack
│   ├── pack.json           # Pack manifest (required)
│   ├── lore.json           # Character lore (optional)
│   ├── pack_icon.webp      # Shop button image
│   ├── characters/
│   │   ├── w01.webp
│   │   ├── w02.webp
│   │   └── ...
│   └── backgrounds/
│       ├── bg_forest.webp
│       ├── bg_castle.webp
│       └── ...
└── husbando/               # Another pack
    └── ...
```

---

## Creating a New Pack

### Step 1: Create the Folder Structure

```
public/packs/villain/
├── pack.json
├── pack_icon.webp
├── characters/
└── backgrounds/
```

### Step 2: Create pack.json

```json
{
  "id": "villain",
  "name": "Villain Pack",
  "description": "Antagonists and dark forces collection",
  "cost": 100,
  "enabled": true,
  "order": 3,

  "characters": [
    { "id": "v01", "name": "The Dark Knight", "background": "bg_castle", "rarity": "c" },
    { "id": "v02", "name": "Shadow Witch", "background": "bg_night", "rarity": "c" },
    { "id": "v03", "name": "Undead King", "background": "bg_ruins", "rarity": "r" },
    { "id": "v04", "name": "Dragon Tyrant", "background": "bg_volcano", "rarity": "sr" },
    { "id": "v05", "name": "Void Emperor", "background": "bg_void", "rarity": "ur" }
  ]
}
```

### Step 3: Add Character Images

Place character images in `characters/` folder:
- Filename must match the character `id` (e.g., `v01.webp` for id `"v01"`)
- Use `.webp` format for optimal performance
- Recommended resolution: 768x1024 pixels (portrait orientation)

### Step 4: Add Background Images

Place background images in `backgrounds/` folder:
- Filename must match the `background` field (e.g., `bg_castle.webp`)
- Use `.webp` format
- Recommended resolution: 1920x1080 pixels (landscape orientation)

### Step 5: Add Pack Icon

Add `pack_icon.webp` to the pack's root folder:
- Displayed in the shop as the pack's purchase button
- Recommended size: 300x400 pixels

### Step 6: Register the Pack

Edit `public/packs/index.json`:

```json
{
  "packs": ["waifu", "husbando", "villain"]
}
```

---

## Asset Requirements

### Character Images
| Property | Requirement |
|----------|-------------|
| Format | `.webp` (preferred) or `.png` |
| Size | 768×1024 px recommended |
| Style | Portrait orientation, character centered |
| Alpha | Transparent background recommended |

### Background Images
| Property | Requirement |
|----------|-------------|
| Format | `.webp` (preferred) or `.png` |
| Size | 1920×1080 px recommended |
| Style | Landscape orientation, atmospheric scene |

### Pack Icon
| Property | Requirement |
|----------|-------------|
| Format | `.webp` or `.png` |
| Size | 300×400 px recommended |
| Style | Vertical card-like appearance |

---

## Pack Manifest Reference

### pack.json Schema

```json
{
  "id": "string",           // Unique pack identifier (must match folder name)
  "name": "string",         // Display name in shop
  "description": "string",  // Optional description
  "cost": 100,              // Cost in gems (default: 100)
  "enabled": true,          // Whether pack is available (default: true)
  "order": 1,               // Sort order in shop (lower = earlier)
  
  "characters": [
    {
      "id": "string",       // Unique character ID (matches image filename)
      "name": "string",     // Character display name
      "background": "string", // Background image ID (without .webp)
      "rarity": "c"         // c, r, sr, ssr, or ur
    }
  ]
}
```

### Rarity Values

| ID | Name | Drop Rate |
|----|------|-----------|
| `c` | Common | 50% |
| `r` | Rare | 30% |
| `sr` | Super Rare | 14% |
| `ssr` | Super Special Rare | 5% |
| `ur` | Ultra Rare | 1% |

**Important**: For balanced gameplay, include characters at multiple rarity tiers:
- Common (c): 6 characters recommended
- Rare (r): 4 characters recommended  
- Super Rare (sr): 3 characters recommended
- SSR (ssr): 1-2 characters recommended
- Ultra Rare (ur): 1 character recommended

---

## Lore Data (Optional)

To add character lore that displays in the card focus view, create `lore.json`:

```json
{
  "v01": {
    "title": "The Dark Knight",
    "quote": "\"In darkness, I find my strength.\"",
    "origin": "Once a noble paladin, corrupted by forbidden power.",
    "story": "A tragic tale of a hero's fall from grace...",
    "abilities": "Shadow Strike, Dark Shield, Void Step"
  },
  "v02": {
    "title": "Shadow Witch",
    "quote": "\"Your fears are my playground.\"",
    "origin": "Born in the cursed swamps of Nethermire.",
    "story": "She learned to harness the shadows...",
    "abilities": "Hex Bolt, Shadow Clone, Nightmare Curse"
  }
}
```

The character ID keys must match those in `pack.json`.

---

## Troubleshooting

### Pack Not Appearing in Shop

1. **Check index.json**: Ensure your pack ID is listed in `public/packs/index.json`
2. **Check pack.json**: Ensure `"enabled": true` is set
3. **Check folder name**: Must match the `id` in pack.json
4. **Check browser console**: Look for loading errors

### Characters Not Displaying

1. **Check filenames**: Image filename must match character `id` exactly
2. **Check format**: Use `.webp` extension
3. **Check path**: Images must be in `characters/` subfolder

### Backgrounds Not Loading

1. **Check background ID**: Must match the `background` field in character data
2. **Check format**: Use `.webp` extension
3. **Check path**: Images must be in `backgrounds/` subfolder

### Console Errors

Open browser DevTools (F12) and check the Console tab for:
- `Failed to load pack`: pack.json is missing or malformed
- `404 errors`: Asset files not found at expected paths
- `JSON parse errors`: Syntax error in pack.json or lore.json

---

## Example Pack Template

A complete example pack is available at:
```
public/packs/waifu/
```

Use this as a reference for:
- Proper pack.json structure
- Character and background organization
- Lore.json formatting
