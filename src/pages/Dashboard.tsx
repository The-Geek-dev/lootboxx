import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Activity, Percent } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const stats = [
    { icon: DollarSign, label: "Total Profit", value: "$12,847.32", change: "+23.4%" },
    { icon: TrendingUp, label: "Active Trades", value: "8", change: "Live" },
    { icon: Activity, label: "Win Rate", value: "87.3%", change: "+5.2%" },
    { icon: Percent, label: "Monthly ROI", value: "14.2%", change: "+2.1%" },
  ];

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />
      
      <div className="container px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <p className="text-gray-400">Monitor your Astra bot performance</p>
            </div>
            <Button className="button-gradient">Configure Bot</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass glass-hover p-6">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="w-8 h-8 text-primary" />
                    <span className="text-sm text-green-500">{stat.change}</span>
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="glass p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Trades</h3>
              <div className="space-y-4">
                {[
                  { pair: "BTC/USDT", action: "Buy", profit: "+$234.12", time: "2 mins ago" },
                  { pair: "ETH/USDT", action: "Sell", profit: "+$156.78", time: "15 mins ago" },
                  { pair: "SOL/USDT", action: "Buy", profit: "+$89.45", time: "1 hour ago" },
                  { pair: "BNB/USDT", action: "Sell", profit: "+$312.90", time: "2 hours ago" },
                ].map((trade, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <div className="font-medium">{trade.pair}</div>
                      <div className="text-sm text-gray-400">{trade.time}</div>
                    </div>
                    <div className="text-right">
                      <div className={trade.action === "Buy" ? "text-green-500" : "text-blue-500"}>
                        {trade.action}
                      </div>
                      <div className="text-green-500 font-medium">{trade.profit}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="glass p-6">
              <h3 className="text-xl font-semibold mb-4">Bot Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Strategy</span>
                  <span>Aggressive Growth</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Risk Level</span>
                  <span className="text-yellow-500">Medium</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Running Since</span>
                  <span>24 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Trades Today</span>
                  <span>47</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-4">Performance Chart</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chart visualization coming soon
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
