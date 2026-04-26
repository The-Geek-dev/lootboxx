import { useRef, useState } from "react";
import { Check, Upload, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AVATAR_PRESETS, getAvatarUrl } from "@/lib/avatars";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  userId: string;
  currentAvatarId?: string | null;
  currentCustomUrl?: string | null;
  onSavePreset: (avatarId: string) => Promise<void> | void;
  onSaveCustomUrl: (url: string | null) => Promise<void> | void;
  saving?: boolean;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const AvatarPicker = ({
  userId,
  currentAvatarId,
  currentCustomUrl,
  onSavePreset,
  onSaveCustomUrl,
  saving,
}: AvatarPickerProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string>(currentAvatarId || AVATAR_PRESETS[0].id);
  const [uploading, setUploading] = useState(false);

  const isDirty = selected !== currentAvatarId;
  const previewUrl = currentCustomUrl
    ? currentCustomUrl
    : getAvatarUrl(selected);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "File too large", description: "Max size is 2 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;

      await onSaveCustomUrl(url);
      toast({ title: "Avatar uploaded!" });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeCustom = async () => {
    await onSaveCustomUrl(null);
    toast({ title: "Custom photo removed" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20 border-2 border-primary/40 shadow-lg shadow-primary/20">
          <AvatarImage src={previewUrl} alt="Selected avatar" />
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="text-sm text-muted-foreground">
          {currentCustomUrl
            ? "Your custom photo is active. Remove it to use a preset avatar."
            : "Pick a preset or upload your own photo."}
        </div>
      </div>

      <Tabs defaultValue={currentCustomUrl ? "upload" : "presets"} className="w-full">
        <TabsList className="grid grid-cols-2 w-full sm:w-80">
          <TabsTrigger value="presets">Preset Avatars</TabsTrigger>
          <TabsTrigger value="upload">Upload Photo</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4 mt-4">
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
            onClick={() => onSavePreset(selected)}
            disabled={!isDirty || saving || !!currentCustomUrl}
            className="button-gradient"
          >
            {saving ? "Saving..." : "Save Preset"}
          </Button>
          {currentCustomUrl && (
            <p className="text-xs text-muted-foreground">
              Remove your custom photo first to switch back to a preset.
            </p>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div className="rounded-lg border border-dashed border-border p-6 text-center bg-muted/10">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Upload a custom profile picture</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF or WEBP. Max 2 MB.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex gap-2 justify-center mt-4 flex-wrap">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || saving}
                className="button-gradient"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Choose Photo</>
                )}
              </Button>
              {currentCustomUrl && (
                <Button
                  variant="outline"
                  onClick={removeCustom}
                  disabled={uploading || saving}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AvatarPicker;
