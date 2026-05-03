"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Eye, Mail, Printer, ChevronRight, MessageCircle } from "lucide-react";
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
  customer?: {
    phoneNumber?: string;
  };
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

  const handleWhatsAppShare = async (receipt: ReceiptData) => {
    const phone = receipt.customer?.phoneNumber;
    const formattedNo = `R-${receipt.receiptNo.toString().padStart(5, '0')}`;
    const amount = formatCurrency(receipt.totalPaidLkr, 'LKR');
    const message = `Hello ${receipt.customerName}, thank you for your purchase at TitanCore. Your receipt ${formattedNo} for ${amount} has been generated.`;

    try {
      // 1. Fetch the PDF blob
      const res = await api.get(`/receipts/${receipt.receiptNo}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const file = new File([blob], `Receipt_${formattedNo}.pdf`, { type: 'application/pdf' });

      // 2. Check if Web Share API is available and can share files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Receipt ${formattedNo}`,
          text: message,
        });
      } else {
        // 3. Fallback for Desktop: Open WhatsApp Web and trigger Download
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = phone 
          ? `https://wa.me/${phone.replace(/\+/g, '')}?text=${encodedMessage}`
          : `https://wa.me/?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        
        // Also trigger download so user can attach it
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Receipt_${formattedNo}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast.info("WhatsApp opened and PDF downloaded. Please attach the downloaded file manually if needed.");
      }
    } catch (error) {
      console.error("Sharing failed", error);
      toast.error("Failed to share receipt");
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
                              <div className="flex items-center gap-1.5 ml-5">
                                <span className="text-[10px] text-zinc-500">
                                  {new Date(receipt.receiptDate).toLocaleDateString()}
                                </span>
                                <span className="sm:hidden text-[8px] font-bold px-1 rounded-full border border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                                  PAID
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-white font-medium text-sm truncate max-w-[100px] sm:max-w-none">
                              {receipt.customerName}
                            </div>
                            <div className="text-[10px] text-zinc-500 hidden md:block">
                              {receipt.paymentMethod || "Cash"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-emerald-400 font-bold text-sm whitespace-nowrap">
                            {formatCurrency(receipt.totalPaidLkr, 'LKR')}
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
                                className="h-8 w-8 text-zinc-400 hover:text-blue-400 hidden md:flex"
                                onClick={() => handlePrintPdf(receipt.receiptNo)}
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-400 hover:text-emerald-500 hidden md:flex"
                                onClick={() => handleWhatsAppShare(receipt)}
                              >
                                <MessageCircle className="w-4 h-4" />
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
