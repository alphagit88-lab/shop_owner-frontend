"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Mail, Printer, MoreVertical, Receipt as ReceiptIcon, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings-context";
import { formatCurrency } from "@/lib/format";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ReceiptDetailPage() {
  const { settings } = useSettings();
  const params = useParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReceipt = async () => {
    try {
      const res = await api.get(`/receipts/${params.no}`);
      setReceipt(res.data);
    } catch (error) {
      toast.error("Failed to fetch receipt details");
      router.push("/dashboard/receipts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [params.no]);

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading...</div>;
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleEmailPdf = async () => {
    const email = prompt("Enter customer email address:", receipt.customer?.email || "");
    if (!email) return;
    
    try {
      await api.post(`/receipts/${receipt.receiptNo}/email`, { email });
      toast.success("Receipt sent successfully!");
    } catch (error) {
      toast.error("Failed to send receipt email");
    }
  };

  const handleWhatsAppShare = async () => {
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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/receipts")} className="text-zinc-400 hover:text-white hover:bg-white/10 print:hidden shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
              <ReceiptIcon className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="truncate">R-{receipt.receiptNo.toString().padStart(5, '0')}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-full font-medium tracking-wide uppercase">
                PAID
              </span>
            </h2>
            <p className="text-xs text-zinc-500">{new Date(receipt.receiptDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Action Buttons - Desktop */}
        <div className="hidden sm:flex gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint} className="border-zinc-700 bg-black/40 text-white hover:bg-white/10">
            <Printer className="w-4 h-4 mr-2" /> Print PDF
          </Button>
          <Button variant="outline" onClick={handleEmailPdf} className="border-zinc-700 bg-black/40 text-white hover:bg-emerald-400/10 hover:text-emerald-400">
            <Mail className="w-4 h-4 mr-2" /> Email PDF
          </Button>
          <Button variant="outline" onClick={handleWhatsAppShare} className="border-zinc-700 bg-black/40 text-white hover:bg-emerald-400/10 hover:text-emerald-400">
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
        </div>

        {/* Action Buttons - Mobile */}
        <div className="flex sm:hidden gap-2 print:hidden justify-end">
          <Button variant="outline" onClick={handlePrint} className="flex-1 border-zinc-700 bg-black/40 text-white text-xs h-9">
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
          </Button>
          <Button variant="outline" onClick={handleEmailPdf} className="flex-1 border-zinc-700 bg-black/40 text-white text-xs h-9">
            <Mail className="w-3.5 h-3.5 mr-1.5" /> Email
          </Button>
          <Button variant="outline" onClick={handleWhatsAppShare} className="flex-1 border-zinc-700 bg-black/40 text-white text-xs h-9">
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
        <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm print:bg-white print:border-gray-200">
          <CardHeader className="py-4">
            <CardTitle className="text-base text-zinc-400 uppercase tracking-wider font-semibold">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-300 print:text-gray-800">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Full Name</p>
              <p className="text-white font-medium">{receipt.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Email</p>
                <p className="text-zinc-400 truncate">{receipt.customer?.email || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Phone</p>
                <p className="text-zinc-400 truncate">{receipt.customer?.phoneNumber || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm print:bg-white print:border-gray-200">
          <CardHeader className="py-4">
            <CardTitle className="text-base text-zinc-400 uppercase tracking-wider font-semibold">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-300 print:text-gray-800">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(receipt.totalPaidLkr, 'LKR')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Method</p>
                <p className="text-white font-medium">{receipt.paymentMethod || "Cash"}</p>
              </div>
            </div>
            {receipt.quotationNo && (
              <div className="pt-2 border-t border-zinc-800/50">
                <p className="text-[10px] text-zinc-500">Linked to Quotation Q-{receipt.quotationNo.toString().padStart(5, '0')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm print:bg-white print:border-gray-200">
        <CardHeader className="py-4">
          <CardTitle className="text-base text-zinc-400 uppercase tracking-wider font-semibold">Purchased Items</CardTitle>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle px-4 md:px-0">
              <div className="rounded-xl border border-zinc-800/50 print:border-gray-300 overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-900/50 print:bg-gray-100">
                    <TableRow className="border-zinc-800/50 print:border-gray-300">
                      <TableHead className="text-zinc-400 print:text-gray-600">Item</TableHead>
                      <TableHead className="text-zinc-400 print:text-gray-600 text-right">Qty</TableHead>
                      <TableHead className="text-zinc-400 print:text-gray-600 text-right">Price</TableHead>
                      <TableHead className="text-zinc-400 print:text-gray-600 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.details?.map((item: any) => (
                      <TableRow key={item.id} className="border-zinc-800/50 print:border-gray-200">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-white text-sm">{item.itemCode || "-"}</span>
                            <span className="text-[10px] text-zinc-500 truncate max-w-[150px] md:max-w-[300px]">{item.itemDescription}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-zinc-300 text-sm whitespace-nowrap">{item.quantity}</TableCell>
                        <TableCell className="text-right text-zinc-400 text-sm whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span>{formatCurrency(settings.currency === 'LKR' ? item.unitPriceLkr : item.unitPriceUsd, settings.currency)}</span>
                            {Number(item.discountPct) > 0 && (
                              <span className="text-[10px] text-red-400">-{item.discountPct}%</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-emerald-400 font-bold text-sm whitespace-nowrap">
                          {formatCurrency(settings.currency === 'LKR' ? item.lineTotalLkr : item.lineTotalUsd, settings.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
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
