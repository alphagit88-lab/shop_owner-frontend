"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Eye, Mail, Printer, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSettings } from "@/lib/settings-context";
import { formatCurrency } from "@/lib/format";

interface ReceiptData {
  receiptNo: number;
  receiptDate: string;
  customerName: string;
  paymentMethod: string;
  totalPaidUsd: string;
  totalPaidLkr: string;
}

export default function ReceiptsPage() {
  const { settings } = useSettings();
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/receipts");
      setReceipts(res.data);
    } catch (error) {
      toast.error("Failed to fetch receipts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleEmailPdf = async (no: number, email: string) => {
    if (!email) {
      const inputEmail = prompt("Enter customer email address:");
      if (!inputEmail) return;
      email = inputEmail;
    }
    
    try {
      await api.post(`/receipts/${no}/email`, { email });
      toast.success("Receipt sent successfully!");
    } catch (error) {
      toast.error("Failed to send receipt email");
    }
  };

  const handlePrintPdf = async (no: number) => {
    try {
      const res = await api.get(`/receipts/${no}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast.error("Failed to open PDF for printing");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Sales Receipts</h2>
        <p className="text-zinc-500 text-sm md:text-base">View your completed sales and send payment confirmations.</p>
      </div>

      <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm">
        <CardContent className="p-0 md:p-6">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle px-4 md:px-0 pt-4 md:pt-0">
              <div className="rounded-xl border border-zinc-800/50 overflow-hidden mb-4 md:mb-0">
                <Table>
                  <TableHeader className="bg-zinc-900/50">
                    <TableRow className="border-zinc-800/50 hover:bg-transparent">
                      <TableHead className="text-zinc-400">ID & Date</TableHead>
                      <TableHead className="text-zinc-400">Customer</TableHead>
                      <TableHead className="text-zinc-400 text-right">Amount</TableHead>
                      <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow className="border-zinc-800/50">
                        <TableCell colSpan={4} className="text-center py-8 text-zinc-500">Loading...</TableCell>
                      </TableRow>
                    ) : receipts.length === 0 ? (
                      <TableRow className="border-zinc-800/50">
                        <TableCell colSpan={4} className="text-center py-8 text-zinc-500">No receipts found</TableCell>
                      </TableRow>
                    ) : (
                      receipts.map((receipt) => (
                        <TableRow key={receipt.receiptNo} className="border-zinc-800/50 hover:bg-white/5 transition-colors">
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 font-medium text-white text-sm">
                                <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                                R-{receipt.receiptNo.toString().padStart(5, '0')}
                              </div>
                              <span className="text-[10px] text-zinc-500 ml-5">
                                {new Date(receipt.receiptDate).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-white font-medium truncate max-w-[100px] md:max-w-none">
                              {receipt.customerName}
                            </div>
                            <div className="text-[10px] text-zinc-500 hidden md:block">
                              {receipt.paymentMethod || "Cash"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-emerald-400 font-bold text-sm whitespace-nowrap">
                            {formatCurrency(settings.currency === 'LKR' ? receipt.totalPaidLkr : receipt.totalPaidUsd, settings.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 md:gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-400 hover:text-white"
                                onClick={() => router.push(`/dashboard/receipts/${receipt.receiptNo}`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-400 hover:text-emerald-400 hidden sm:flex"
                                onClick={() => handleEmailPdf(receipt.receiptNo, "")}
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-400 hover:text-blue-400"
                                onClick={() => handlePrintPdf(receipt.receiptNo)}
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
