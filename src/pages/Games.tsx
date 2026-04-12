import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDepositGate } from "@/hooks/useDepositGate";
import { allGames, categories, getGamesByCategory, type GameCategory, type GameItem } from "@/config/gamesData";
import { useToast } from "@/hooks/use-toast";

const GameCard = ({ game, size = "normal" }: { game: GameItem; size?: "normal" | "large" | "numbered"; index?: number }) => {
  const { toast } = useToast();

  const handleClick = () => {
    if (!game.isPlayable) {
      toast({ title: "Coming Soon! 🎮", description: `${game.name} will be available soon.` });
    }
  };

  const content = (
    <div className={`relative rounded-xl overflow-hidden cursor-pointer group transition-transform hover:scale-105 ${size === "large" ? "h-36 sm:h-44" : "h-28 sm:h-32"}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-90`} />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        <span className={`${size === "large" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"} mb-1`}>{game.emoji}</span>
        <p className="text-foreground font-semibold text-xs sm:text-sm text-center leading-tight px-1">{game.name}</p>
        {game.isVip && (
          <div className="absolute top-1.5 left-1.5">
            <Badge className="text-[9px] px-1 py-0 bg-yellow-500/90 text-yellow-950 border-0 font-bold">
              👑 VIP
            </Badge>
          </div>
        )}
        {!game.isPlayable && !game.isVip && (
          <div className="absolute top-2 right-2">
            <Lock className="w-3 h-3 text-foreground/70" />
          </div>
        )}
        {game.isPlayable && (
          <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0 bg-primary/30 text-primary border-0">
            LIVE
          </Badge>
        )}
        <span className="text-[9px] text-foreground/70 mt-0.5">{game.pointCost} pts</span>
      </div>
      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors" />
    </div>
  );

  if (game.isPlayable) {
    return <Link to={game.path}>{content}</Link>;
  }
  return <div onClick={handleClick}>{content}</div>;
};

const HorizontalScroller = ({ children, title, emoji, showAll }: { children: React.ReactNode; title: string; emoji: string; showAll?: () => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -250 : 250, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
          <span>{emoji}</span> {title}
        </h2>
        <div className="flex items-center gap-2">
          {showAll && (
            <button onClick={showAll} className="text-xs text-primary hover:underline">Show All</button>
          )}
          <button onClick={() => scroll("left")} className="p-1 rounded-full bg-card hover:bg-accent transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} className="p-1 rounded-full bg-card hover:bg-accent transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {children}
      </div>
    </div>
  );
};

const Games = () => {
  const navigate = useNavigate();
  const { isAuthorized, isChecking } = useDepositGate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<GameCategory | "all">("all");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!isAuthorized || isChecking || isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    </div>
  );

  const filteredGames = allGames.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (activeCategory === "all" || g.category.includes(activeCategory as GameCategory))
  );

  const topGames = getGamesByCategory("top");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <main className="pl-16 container px-3 pt-24 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1 className="text-xl sm:text-3xl font-bold text-center mb-1">
            LootBox <span className="text-gradient">Games</span>
          </h1>
          <p className="text-muted-foreground text-center text-xs sm:text-sm mb-4">
            {allGames.length} games available • {allGames.filter(g => g.isPlayable).length} live now
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search games..."
            className="pl-9 bg-card/50 border-border/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            🏠 All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Search Results / Category View */}
        {(searchQuery || activeCategory !== "all") ? (
          <div>
            <p className="text-sm text-muted-foreground mb-3">{filteredGames.length} games found</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
            {filteredGames.length === 0 && (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">🎮</p>
                <p className="text-muted-foreground">No games found</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Top Games - Grid like Sporty */}
            <div className="mb-6">
              <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
                <span>🔥</span> Top Games in Nigeria
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {topGames.slice(0, 6).map((game, i) => (
                  <div key={game.id} className="relative">
                    <div className="absolute top-1 left-1 z-10 bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5 rounded flex items-center justify-center">
                      {i + 1}
                    </div>
                    <GameCard game={game} size="large" index={i} />
                  </div>
                ))}
              </div>
            </div>

            {/* Category carousels */}
            {categories.filter(c => c.key !== "top").map((cat) => {
              const games = getGamesByCategory(cat.key);
              if (games.length === 0) return null;
              return (
                <HorizontalScroller
                  key={cat.key}
                  title={cat.label}
                  emoji={cat.emoji}
                  showAll={() => setActiveCategory(cat.key)}
                >
                  {games.map((game) => (
                    <div key={game.id} className="flex-shrink-0 w-28 sm:w-32">
                      <GameCard game={game} />
                    </div>
                  ))}
                </HorizontalScroller>
              );
            })}

            {/* All Games */}
            <div className="mt-6">
              <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
                <span>🎮</span> All Games ({allGames.length})
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {allGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Games;
