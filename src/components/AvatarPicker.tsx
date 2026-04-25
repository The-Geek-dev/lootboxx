import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AVATAR_PRESETS, getAvatarUrl } from "@/lib/avatars";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  currentAvatarId?: string | null;
  onSave: (avatarId: string) => Promise<void> | void;
  saving?: boolean;
}

const AvatarPicker = ({ currentAvatarId, onSave, saving }: AvatarPickerProps) => {
  const [selected, setSelected] = useState<string>(currentAvatarId || AVATAR_PRESETS[0].id);
  const isDirty = selected !== currentAvatarId;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20 border-2 border-primary/40 shadow-lg shadow-primary/20">
          <AvatarImage src={getAvatarUrl(selected)} alt="Selected avatar" />
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="text-sm text-muted-foreground">
          Pick an avatar to represent you across LootBoxx.
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-72 overflow-y-auto p-2 rounded-lg bg-muted/20 border border-border/50">
        {AVATAR_PRESETS.map((preset) => {
          const isSelected = preset.id === selected;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelected(preset.id)}
              className={cn(
                "relative aspect-square rounded-full overflow-hidden ring-2 transition-all hover:scale-105",
                isSelected
                  ? "ring-primary shadow-md shadow-primary/40"
                  : "ring-transparent hover:ring-primary/40"
              )}
              aria-label={`Select ${preset.label}`}
              title={preset.label}
            >
              <img
                src={getAvatarUrl(preset.id)}
                alt={preset.label}
                loading="lazy"
                className="w-full h-full object-cover bg-background"
              />
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Button
        onClick={() => onSave(selected)}
        disabled={!isDirty || saving}
        className="button-gradient"
      >
        {saving ? "Saving..." : "Save Avatar"}
      </Button>
    </div>
  );
};

export default AvatarPicker;
