import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type State = "validating" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("validating");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const data = await res.json();
        if (res.ok && data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success || data?.reason === "already_unsubscribed") setState("done");
      else throw new Error(data?.error || "Failed to unsubscribe");
    } catch (e: any) {
      setErrorMsg(e.message || "Something went wrong");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 container px-4 pt-32 pb-16 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          {state === "validating" && (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Checking your unsubscribe link…</p>
            </>
          )}
          {state === "valid" && (
            <>
              <MailX className="w-12 h-12 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Unsubscribe from emails?</h1>
              <p className="text-sm text-muted-foreground mb-6">
                You'll stop receiving notification emails from LootBoxx. You can
                still log in to your account anytime.
              </p>
              <Button onClick={confirm} className="button-gradient w-full">
                Confirm Unsubscribe
              </Button>
            </>
          )}
          {state === "submitting" && (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Processing…</p>
            </>
          )}
          {state === "done" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">You're unsubscribed</h1>
              <p className="text-sm text-muted-foreground mb-6">
                We won't email you again. Sorry to see you go!
              </p>
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
            </>
          )}
          {state === "already" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Already unsubscribed</h1>
              <p className="text-sm text-muted-foreground mb-6">
                This email is already on our suppression list.
              </p>
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
            </>
          )}
          {state === "invalid" && (
            <>
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Invalid link</h1>
              <p className="text-sm text-muted-foreground mb-6">
                This unsubscribe link is invalid or has expired.
              </p>
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
            </>
          )}
          {state === "error" && (
            <>
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
              <Button onClick={confirm} variant="outline">Try again</Button>
            </>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Unsubscribe;
