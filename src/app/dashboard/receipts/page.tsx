"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Eye, Mail, Printer } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Sales Receipts</h2>
          <p className="text-zinc-500">View your completed sales and send payment confirmations.</p>
        </div>
      </div>

      <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="rounded-md border border-zinc-800/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800/50 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Receipt No.</TableHead>
                  <TableHead className="text-zinc-400">Date</TableHead>
                  <TableHead className="text-zinc-400">Customer</TableHead>
                  <TableHead className="text-zinc-400">Payment Method</TableHead>
                  <TableHead className="text-zinc-400 text-right">Paid</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="border-zinc-800/50">
                    <TableCell colSpan={7} className="text-center py-8 text-zinc-500">Loading receipts...</TableCell>
                  </TableRow>
                ) : receipts.length === 0 ? (
                  <TableRow className="border-zinc-800/50">
                    <TableCell colSpan={7} className="text-center py-8 text-zinc-500">No completed sales found</TableCell>
                  </TableRow>
                ) : (
                  receipts.map((receipt) => (
                    <TableRow key={receipt.receiptNo} className="border-zinc-800/50 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-emerald-500" />
                          R-{receipt.receiptNo.toString().padStart(5, '0')}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-300">{new Date(receipt.receiptDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-white font-medium">{receipt.customerName}</TableCell>
                      <TableCell className="text-zinc-400">{receipt.paymentMethod || "Cash"}</TableCell>
                      <TableCell className="text-right text-emerald-400 font-medium">
                        {formatCurrency(settings.currency === 'LKR' ? receipt.totalPaidLkr : receipt.totalPaidUsd, settings.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
                            onClick={() => router.push(`/dashboard/receipts/${receipt.receiptNo}`)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                            onClick={() => handleEmailPdf(receipt.receiptNo, "")}
                            title="Email PDF Receipt"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10"
                            onClick={() => handlePrintPdf(receipt.receiptNo)}
                            title="Print PDF Receipt"
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
        </CardContent>
      </Card>
    </div>
  );
}
