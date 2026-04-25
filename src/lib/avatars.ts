// Preset avatar catalog. Avatars are generated via DiceBear (no storage needed).
// Each preset has a stable id we persist in profiles.avatar_id.

export type AvatarPreset = {
  id: string;
  label: string;
  style: "bottts" | "adventurer" | "fun-emoji" | "shapes" | "thumbs" | "pixel-art" | "lorelei" | "notionists";
  seed: string;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "bot-neon", label: "Neon Bot", style: "bottts", seed: "Lootboxx-Neon" },
  { id: "bot-cyber", label: "Cyber Bot", style: "bottts", seed: "Lootboxx-Cyber" },
  { id: "bot-vault", label: "Vault Bot", style: "bottts", seed: "Lootboxx-Vault" },
  { id: "bot-jackpot", label: "Jackpot Bot", style: "bottts", seed: "Lootboxx-Jackpot" },
  { id: "adv-spade", label: "Spade", style: "adventurer", seed: "Spade-Player" },
  { id: "adv-ace", label: "Ace", style: "adventurer", seed: "Ace-Hunter" },
  { id: "adv-rogue", label: "Rogue", style: "adventurer", seed: "Rogue-Loot" },
  { id: "adv-queen", label: "Queen", style: "adventurer", seed: "Queen-Bee" },
  { id: "pixel-1", label: "Pixel Hero", style: "pixel-art", seed: "Pixel-Hero" },
  { id: "pixel-2", label: "Pixel Mage", style: "pixel-art", seed: "Pixel-Mage" },
  { id: "lorelei-1", label: "Smooth", style: "lorelei", seed: "Smooth-Operator" },
  { id: "lorelei-2", label: "Rebel", style: "lorelei", seed: "Rebel-Heart" },
  { id: "notion-1", label: "Hustler", style: "notionists", seed: "Hustler" },
  { id: "notion-2", label: "Mogul", style: "notionists", seed: "Mogul" },
  { id: "emoji-fire", label: "Fire", style: "fun-emoji", seed: "Fire-Streak" },
  { id: "emoji-star", label: "Star", style: "fun-emoji", seed: "Star-Power" },
  { id: "emoji-luck", label: "Lucky", style: "fun-emoji", seed: "Lucky-Charm" },
  { id: "shape-1", label: "Glyph", style: "shapes", seed: "Glyph-One" },
  { id: "shape-2", label: "Sigil", style: "shapes", seed: "Sigil-Two" },
  { id: "thumbs-1", label: "Thumb Up", style: "thumbs", seed: "Thumbs-Up" },
];

export const DEFAULT_AVATAR_ID = "bot-neon";

export function getAvatarUrl(avatarId?: string | null): string {
  const preset =
    AVATAR_PRESETS.find((a) => a.id === avatarId) ??
    AVATAR_PRESETS.find((a) => a.id === DEFAULT_AVATAR_ID)!;
  const seed = encodeURIComponent(preset.seed);
  return `https://api.dicebear.com/7.x/${preset.style}/svg?seed=${seed}&radius=50`;
}

export function getAvatarUrlForName(name?: string | null): string {
  // Fallback when user has no avatar_id yet — derive from name for stable look.
  const seed = encodeURIComponent((name || "Player").trim() || "Player");
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&radius=50`;
}
