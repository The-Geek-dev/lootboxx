import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GameSettings {
  difficulty_level: number;
  win_rate_modifier: number;
  payout_modifier: number;
  is_active: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  difficulty_level: 5,
  win_rate_modifier: 1.0,
  payout_modifier: 1.0,
  is_active: false,
};

export const useGameSettings = () => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase.rpc("get_my_game_settings");
        if (!error && data && data.length > 0) {
          setSettings({
            difficulty_level: data[0].difficulty_level,
            win_rate_modifier: Number(data[0].win_rate_modifier),
            payout_modifier: Number(data[0].payout_modifier),
            is_active: data[0].is_active,
          });
        }
      } catch {
        // Use defaults
      }
      setLoaded(true);
    };
    fetch();
  }, []);

  /** Apply win rate modifier: returns true if player should win, given base probability */
  const shouldWin = (baseProbability: number): boolean => {
    if (!settings.is_active) return Math.random() < baseProbability;
    const adjusted = baseProbability * settings.win_rate_modifier;
    return Math.random() < Math.min(1, Math.max(0, adjusted));
  };

  /** Apply payout modifier to a win amount */
  const adjustPayout = (baseAmount: number): number => {
    if (!settings.is_active) return baseAmount;
    return Math.round(baseAmount * settings.payout_modifier);
  };

  return { settings, loaded, shouldWin, adjustPayout };
};
