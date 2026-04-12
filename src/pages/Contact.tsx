import { motion } from "framer-motion";
import { Mail, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import MascotBackground from "@/components/MascotBackground";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <AppSidebar />
      <div className="md:pl-16 container px-4 pt-32 pb-20 relative overflow-hidden">
        <MascotBackground position="left" />
        <MascotBackground variant="watermark" corner="bottom-right" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-xl text-gray-300 mb-16 text-center max-w-3xl mx-auto">
            Have questions about LootBox? We're here to help you get started with gaming and winning.
          </p>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass glass-hover rounded-xl p-6">
              <Mail className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Email Us</h3>
              <p className="text-gray-400 mb-4">Get in touch via email for detailed inquiries</p>
              <a href="mailto:support@lootbox.app" className="text-primary hover:underline">support@lootbox.app</a>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass glass-hover rounded-xl p-6">
              <MessageSquare className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-400 mb-4">Chat with our support team in real-time</p>
              <Button variant="outline" className="w-full">Start Chat</Button>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Your Name</label>
                  <Input id="name" placeholder="John Doe" required className="bg-background/50" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
                  <Input id="email" type="email" placeholder="john@example.com" required className="bg-background/50" />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
                <Input id="subject" placeholder="How can we help?" required className="bg-background/50" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                <Textarea id="message" placeholder="Tell us more about your inquiry..." rows={6} required className="bg-background/50" />
              </div>
              <Button type="submit" size="lg" className="button-gradient w-full">
                Send Message <Send className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
