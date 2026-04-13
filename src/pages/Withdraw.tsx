import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Rocket, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Withdraw = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AppSidebar />
      <div className="md:pl-16 min-h-screen flex flex-col">
        <main className="container px-4 pt-32 pb-24 flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Banknote className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Coming Soon!</h1>
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-8 h-8 text-accent animate-bounce" />
            </div>
            <p className="text-muted-foreground mb-6">
              Withdrawals are not yet available. LootBoxx is launching very soon — sign up now so you're ready to cash out when we go live!
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/signup">
                <Button className="button-gradient">Sign Up Now</Button>
              </Link>
              <Link to="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Withdraw;
