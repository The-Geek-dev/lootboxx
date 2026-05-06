"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getRotatedTestimonials, type Testimonial } from "@/data/testimonialsPool";

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";

const StarRating = ({ rating, size = 4 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5 mb-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-${size} h-${size} ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`}
      />
    ))}
  </div>
);

const TestimonialCard = ({ t, keyId }: { t: Testimonial; keyId: string }) => (
  <Card key={keyId} className="w-[400px] shrink-0 bg-black/40 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all duration-300 p-8">
    <div className="flex items-center gap-4 mb-4">
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-primary/20 text-primary font-semibold">{t.initials}</AvatarFallback>
      </Avatar>
      <div>
        <h4 className="font-medium text-white/90">{t.name}</h4>
        <p className="text-sm text-white/60">{t.role}</p>
      </div>
    </div>
    <StarRating rating={t.rating} />
    <p className="text-white/70 leading-relaxed">{t.content}</p>
  </Card>
);

const SubmitForm = ({ onSubmitted }: { onSubmitted: () => void }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user.id ?? null);
      const meta = session?.user.user_metadata as any;
      if (meta?.full_name && !name) setName(meta.full_name);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please sign in to share your testimony");
      return;
    }
    const trimmedName = name.trim();
    const trimmedContent = content.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      toast.error("Name must be 2-60 characters");
      return;
    }
    if (trimmedContent.length < 20 || trimmedContent.length > 500) {
      toast.error("Testimony must be 20-500 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("user_testimonials").insert({
      user_id: userId,
      display_name: trimmedName,
      location: location.trim() || null,
      content: trimmedContent,
      rating,
    });
    setLoading(false);
    if (error) {
      toast.error("Could not submit. Try again later.");
      return;
    }
    toast.success("Thanks! Your testimony is live 🎉");
    setContent("");
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4 bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
      {!userId && (
        <p className="text-sm text-yellow-400/90">Sign in to submit your testimony.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="t-name" className="text-white/80">Display name</Label>
          <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chinedu O." maxLength={60} required />
        </div>
        <div>
          <Label htmlFor="t-loc" className="text-white/80">Location (optional)</Label>
          <Input id="t-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos" maxLength={40} />
        </div>
      </div>
      <div>
        <Label className="text-white/80">Rating</Label>
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star className={`w-6 h-6 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-white/30"}`} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="t-content" className="text-white/80">Your testimony</Label>
        <Textarea id="t-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your LootBoxx experience (English or Pidgin)…" rows={4} maxLength={500} required />
        <p className="text-xs text-white/40 mt-1">{content.length}/500</p>
      </div>
      <Button type="submit" disabled={loading || !userId} className="w-full">
        {loading ? "Submitting…" : "Share my testimony"}
      </Button>
    </form>
  );
};

const TestimonialsSection = () => {
  const [userTestimonials, setUserTestimonials] = useState<Testimonial[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const rotated = useMemo(() => getRotatedTestimonials(8), []);

  const fetchUserTestimonials = async () => {
    const { data } = await supabase
      .from("user_testimonials")
      .select("display_name, location, content, rating")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(12);
    if (data) {
      setUserTestimonials(
        data.map((d: any) => ({
          name: d.display_name,
          role: d.location ? `Player • ${d.location}` : "Player",
          initials: initialsOf(d.display_name),
          rating: d.rating,
          content: d.content,
        }))
      );
    }
  };

  useEffect(() => {
    fetchUserTestimonials();
  }, [reloadKey]);

  const allTestimonials = useMemo(() => {
    // User testimonials first, then rotated pool
    return [...userTestimonials, ...rotated];
  }, [userTestimonials, rotated]);

  return (
    <section className="py-20 overflow-hidden bg-black">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <h2 className="text-5xl font-normal mb-4">Trusted by Nigerians</h2>
          <p className="text-muted-foreground text-lg">
            Real players, real wins — fresh voices every 12 hours
          </p>
        </motion.div>

        <Tabs defaultValue="stories" className="w-full">
          <TabsList className="mx-auto mb-10 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="share">Share yours</TabsTrigger>
          </TabsList>

          <TabsContent value="stories">
            <div className="relative flex flex-col antialiased">
              <div className="relative flex overflow-hidden py-4">
                <div className="animate-marquee flex min-w-full shrink-0 items-stretch gap-8">
                  {allTestimonials.map((t, i) => (
                    <TestimonialCard key={`a-${i}`} keyId={`a-${i}`} t={t} />
                  ))}
                </div>
                <div className="animate-marquee flex min-w-full shrink-0 items-stretch gap-8">
                  {allTestimonials.map((t, i) => (
                    <TestimonialCard key={`b-${i}`} keyId={`b-${i}`} t={t} />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="share">
            <SubmitForm onSubmitted={() => setReloadKey((k) => k + 1)} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default TestimonialsSection;
