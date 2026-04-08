import { Ticket, Gift, Brain, Users } from "lucide-react";
import featureRaffle from "@/assets/feature-raffle.jpg";
import featureSpin from "@/assets/feature-spin.jpg";
import featureTrivia from "@/assets/feature-trivia.jpg";
import featureReferral from "@/assets/feature-referral.jpg";

export const features = [
  {
    title: "Raffle & Lottery",
    description: "Enter exciting raffles with huge prize pools. Buy tickets and stand a chance to win big rewards every draw.",
    icon: <Ticket className="w-6 h-6" />,
    image: featureRaffle
  },
  {
    title: "Spin the Wheel",
    description: "Try your luck with our spin-the-wheel game. Every spin guarantees a prize — from bonus credits to jackpot rewards.",
    icon: <Gift className="w-6 h-6" />,
    image: featureSpin
  },
  {
    title: "Trivia & Quiz",
    description: "Test your knowledge and win bonuses. Answer questions correctly to earn rewards and climb the leaderboard.",
    icon: <Brain className="w-6 h-6" />,
    image: featureTrivia
  },
  {
    title: "Referral Program",
    description: "Invite friends and earn bonus rewards. The more friends you refer, the bigger your earnings grow.",
    icon: <Users className="w-6 h-6" />,
    image: featureReferral
  }
];
