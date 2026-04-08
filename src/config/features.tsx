import { Ticket, Gift, Brain, Users } from "lucide-react";

export const features = [
  {
    title: "Raffle & Lottery",
    description: "Enter exciting raffles with huge prize pools. Buy tickets and stand a chance to win big rewards every draw.",
    icon: <Ticket className="w-6 h-6" />,
    image: "/lovable-uploads/86329743-ee49-4f2e-96f7-50508436273d.png"
  },
  {
    title: "Spin the Wheel",
    description: "Try your luck with our spin-the-wheel game. Every spin guarantees a prize — from bonus credits to jackpot rewards.",
    icon: <Gift className="w-6 h-6" />,
    image: "/lovable-uploads/7335619d-58a9-41ad-a233-f7826f56f3e9.png"
  },
  {
    title: "Trivia & Quiz",
    description: "Test your knowledge and win bonuses. Answer questions correctly to earn rewards and climb the leaderboard.",
    icon: <Brain className="w-6 h-6" />,
    image: "/lovable-uploads/b6436838-5c1a-419a-9cdc-1f9867df073d.png"
  },
  {
    title: "Referral Program",
    description: "Invite friends and earn bonus rewards. The more friends you refer, the bigger your earnings grow.",
    icon: <Users className="w-6 h-6" />,
    image: "/lovable-uploads/79f2b901-8a4e-42a5-939f-fae0828e0aef.png"
  }
];
