import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ThumbsUp, ThumbsDown, Check, Send, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MascotBackground from "@/components/MascotBackground";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const getSessionId = () => {
  let sessionId = sessionStorage.getItem("faq_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("faq_session_id", sessionId);
  }
  return sessionId;
};

const FAQ = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [submittedFeedback, setSubmittedFeedback] = useState<Record<string, boolean | null>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);
  const [showCommentFor, setShowCommentFor] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");

  const faqs = [
    {
      id: "general-1",
      category: "General",
      question: "What is LootBox?",
      answer: "LootBox is a gaming rewards platform where you can play exciting games like raffles, spin-the-wheel, trivia quizzes, and more to win real rewards. Deposit funds, buy coupons, and start playing!"
    },
    {
      id: "general-2",
      category: "General",
      question: "Is LootBox safe and legitimate?",
      answer: "Yes! LootBox uses bank-grade encryption, provably fair gaming algorithms, and secure payment processing. All games are transparent and results are verifiable."
    },
    {
      id: "deposit-1",
      category: "Deposits",
      question: "How do I deposit funds?",
      answer: "Go to your dashboard and click 'Deposit Now'. We accept multiple payment methods. The minimum deposit is ₦7,000. Your balance updates instantly after payment confirmation."
    },
    {
      id: "deposit-2",
      category: "Deposits",
      question: "What is the minimum deposit amount?",
      answer: "The minimum deposit is ₦7,000. This gives you enough balance to buy coupons and start playing multiple games."
    },
    {
      id: "games-1",
      category: "Games",
      question: "What games are available?",
      answer: "LootBox offers Raffle Draws, Spin-the-Wheel, Trivia Quizzes, and Lucky Slots. We're constantly adding new games to keep things exciting!"
    },
    {
      id: "games-2",
      category: "Games",
      question: "How do coupons work?",
      answer: "Coupons are your tickets to play games. You purchase coupons with your deposited balance, then use them to enter games. Different games may require different coupon tiers."
    },
    {
      id: "games-3",
      category: "Games",
      question: "Are the games fair?",
      answer: "Absolutely! All games use provably fair algorithms. Results are generated using verified random number generators and can be independently verified for transparency."
    },
    {
      id: "referral-1",
      category: "Referrals",
      question: "How does the referral program work?",
      answer: "Share your unique referral code with friends. When they sign up and make their first deposit, you both earn bonus rewards. There's no limit to how many people you can refer!"
    },
    {
      id: "referral-2",
      category: "Referrals",
      question: "How much can I earn from referrals?",
      answer: "You earn a bonus for every friend who signs up and deposits. The more active referrals you have, the bigger your earnings. Check your dashboard for current referral bonus rates."
    },
    {
      id: "withdraw-1",
      category: "Withdrawals",
      question: "How do I withdraw my winnings?",
      answer: "Go to your dashboard and click on the withdrawal option. Enter the amount and your preferred payment method. Withdrawals are processed quickly with no hidden fees."
    },
    {
      id: "withdraw-2",
      category: "Withdrawals",
      question: "Is there a minimum withdrawal amount?",
      answer: "Yes, there is a minimum withdrawal amount to cover processing costs. Check your dashboard for the current minimum withdrawal threshold."
    },
    {
      id: "security-1",
      category: "Security",
      question: "How is my money protected?",
      answer: "Your funds are protected with bank-grade encryption, secure payment gateways, and two-factor authentication. We never store your payment details on our servers."
    },
    {
      id: "security-2",
      category: "Security",
      question: "Can I enable two-factor authentication?",
      answer: "Yes! Go to Settings to enable 2FA. This adds an extra layer of security by requiring a verification code sent to your email every time you log in."
    },
  ];

  const categories = useMemo(() => {
    const cats = [...new Set(faqs.map(faq => faq.category))];
    return ["All", ...cats];
  }, []);

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
      const matchesSearch = searchQuery === "" || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: faqs.length };
    faqs.forEach(faq => {
      counts[faq.category] = (counts[faq.category] || 0) + 1;
    });
    return counts;
  }, []);

  const submitFeedback = async (questionId: string, isHelpful: boolean, comment?: string) => {
    if (submittedFeedback[questionId] !== undefined) return;
    setSubmittingFeedback(questionId);
    try {
      const { error } = await supabase.from("faq_feedback").insert({
        question_id: questionId, is_helpful: isHelpful, comment: comment || null,
        user_agent: navigator.userAgent, session_id: getSessionId(),
      });
      if (error) throw error;
      setSubmittedFeedback(prev => ({ ...prev, [questionId]: isHelpful }));
      setShowCommentFor(null);
      setFeedbackComment("");
      toast({ title: "Thanks for your feedback!", description: isHelpful ? "We're glad this was helpful." : "We'll work on improving this answer." });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({ title: "Couldn't submit feedback", description: "Please try again later.", variant: "destructive" });
    } finally {
      setSubmittingFeedback(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />
      <div className="container px-4 pt-32 pb-20 relative overflow-hidden">
        <MascotBackground position="right" />
        <MascotBackground variant="watermark" corner="top-left" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 text-center max-w-3xl mx-auto">
            Everything you need to know about LootBox gaming and rewards
          </p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input type="text" placeholder="Search questions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 pr-12 py-6 text-lg bg-background/50 border-white/10 rounded-xl" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((category) => (
              <button key={category} onClick={() => setActiveCategory(category)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeCategory === category ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>
                {category} <span className={`ml-2 text-xs ${activeCategory === category ? "opacity-80" : "opacity-50"}`}>({categoryCounts[category] || 0})</span>
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {(searchQuery || activeCategory !== "All") && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 text-center">
                <span className="text-gray-400">Showing {filteredFaqs.length} of {faqs.length} questions{searchQuery && (<span> matching "<span className="text-primary">{searchQuery}</span>"</span>)}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-8 md:p-12">
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredFaqs.map((faq, index) => (
                    <motion.div key={faq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: index * 0.03 }}>
                      <AccordionItem value={faq.id} className="border-white/10">
                        <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                          <div className="flex items-start gap-3">
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary shrink-0 mt-1">{faq.category}</span>
                            <span>{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-400 text-base pl-16">
                          <p className="mb-4">{faq.answer}</p>
                          <div className="pt-4 border-t border-white/10">
                            {submittedFeedback[faq.id] !== undefined ? (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Check className="w-4 h-4 text-primary" /> Thanks for your feedback!
                              </div>
                            ) : showCommentFor === faq.id ? (
                              <div className="space-y-3">
                                <p className="text-sm text-gray-500">How can we improve this answer?</p>
                                <Textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} placeholder="Optional: tell us how we can improve..." className="bg-background/50 text-sm" rows={3} />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => submitFeedback(faq.id, false, feedbackComment)} disabled={submittingFeedback === faq.id} className="button-gradient">
                                    {submittingFeedback === faq.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3 h-3 mr-1" /> Submit</>}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setShowCommentFor(null); setFeedbackComment(""); }}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500">Was this helpful?</span>
                                <button onClick={() => submitFeedback(faq.id, true)} disabled={submittingFeedback === faq.id} className="flex items-center gap-1 text-sm text-gray-400 hover:text-primary transition-colors">
                                  {submittingFeedback === faq.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />} Yes
                                </button>
                                <button onClick={() => setShowCommentFor(faq.id)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-destructive transition-colors">
                                  <ThumbsDown className="w-4 h-4" /> No
                                </button>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Accordion>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-2">No matching questions found</p>
                <p className="text-gray-500">Try adjusting your search or category filter</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
