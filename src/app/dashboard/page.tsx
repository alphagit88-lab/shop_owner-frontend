"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, FileText, Users, Receipt, TrendingUp, ArrowUpRight } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useSettings } from "@/lib/settings-context";

export default function DashboardPage() {
  const { settings } = useSettings();
  const [stats, setStats] = useState({
    items: 0,
    quotations: 0,
    customers: 0,
    receipts: 0,
    totalUsd: 0,
    totalLkr: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [items, quotations, customers, receipts] = await Promise.all([
          api.get("/items"),
          api.get("/quotations"),
          api.get("/customers"),
          api.get("/receipts")
        ]);

        const totalUsd = receipts.data.reduce((acc: number, r: any) => acc + Number(r.totalPaidUsd), 0);
        const totalLkr = receipts.data.reduce((acc: number, r: any) => acc + Number(r.totalPaidLkr), 0);

        setStats({
          items: items.data.length,
          quotations: quotations.data.length,
          customers: customers.data.length,
          receipts: receipts.data.length,
          totalUsd,
          totalLkr
        });
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: "Total Items", value: stats.items, icon: Gem, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Active Quotations", value: stats.quotations, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Total Customers", value: stats.customers, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Completed Sales", value: stats.receipts, icon: Receipt, color: "text-green-500", bg: "bg-green-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-white">Overview</h2>
        <p className="text-zinc-500">A snapshot of your shop&apos;s current performance and inventory.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-white/5 border-zinc-800/50 backdrop-blur-sm hover:bg-white/[0.07] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-400">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4">
        <Card className={`bg-gradient-to-br ${settings.currency === 'LKR' ? 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20' : 'from-blue-500/20 to-blue-600/5 border-blue-500/20'} backdrop-blur-sm`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${settings.currency === 'LKR' ? 'text-emerald-500' : 'text-blue-500'} uppercase tracking-wider`}>Total Revenue ({settings.currency})</CardTitle>
            <TrendingUp className={`w-4 h-4 ${settings.currency === 'LKR' ? 'text-emerald-500' : 'text-blue-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">
              {formatCurrency(settings.currency === 'LKR' ? stats.totalLkr : stats.totalUsd, settings.currency)}
            </div>
            <div className={`mt-2 flex items-center text-xs ${settings.currency === 'LKR' ? 'text-emerald-500/70' : 'text-blue-500/70'} font-medium`}>
              <ArrowUpRight className="w-3 h-3 mr-1" />
              Total earnings in {settings.currency === 'LKR' ? 'Sri Lankan Rupees' : settings.currency === 'USD' ? 'US Dollars' : settings.currency}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

