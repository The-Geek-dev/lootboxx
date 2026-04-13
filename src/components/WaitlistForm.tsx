import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Rocket, CheckCircle2 } from "lucide-react";

const CITIES = [
  "Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Benin City",
  "Warri", "Calabar", "Abeokuta", "Jos", "Owerri", "Kaduna", "Uyo", "Asaba",
  "Akure", "Ilorin", "Onitsha", "Sokoto", "Maiduguri", "Zaria", "Aba",
];

const WaitlistForm = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !city) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("waitlist").insert({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      city,
    });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast.info("You're already on the waitlist! We'll notify you at launch.");
        setJoined(true);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      return;
    }

    toast.success("You're on the waitlist! 🎉");
    setJoined(true);
  };

  if (joined) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="text-xl font-bold mb-2">You're on the list! 🎉</h3>
        <p className="text-muted-foreground text-sm">
          We'll notify you when LootBoxx launches in your region.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Rocket className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold">Join the Waitlist</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Be the first to know when LootBoxx launches in your city
        </p>
      </div>

      <Input
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        maxLength={100}
        required
      />
      <Input
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={255}
        required
      />
      <Select value={city} onValueChange={setCity}>
        <SelectTrigger>
          <SelectValue placeholder="Select your city" />
        </SelectTrigger>
        <SelectContent>
          {CITIES.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" className="w-full button-gradient" disabled={loading}>
        {loading ? "Joining..." : "Join Waitlist"}
      </Button>
    </form>
  );
};

export default WaitlistForm;
