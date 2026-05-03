"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Mail, Printer } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings-context";
import { formatCurrency } from "@/lib/format";

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/receipts")} className="text-zinc-400 hover:text-white hover:bg-white/10 print:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Receipt R-{receipt.receiptNo.toString().padStart(5, '0')}
              <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-full font-medium tracking-wide uppercase">
                PAID
              </span>
            </h2>
            <p className="text-zinc-500">{new Date(receipt.receiptDate).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint} className="border-zinc-700 bg-black/40 text-white hover:bg-white/10">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button variant="outline" onClick={handleEmailPdf} className="border-zinc-700 bg-black/40 text-white hover:bg-emerald-400 hover:text-emerald-400 hover:border-emerald-400/50">
            <Mail className="w-4 h-4 mr-2" /> Email PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
        <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm print:bg-white print:border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-white print:text-white">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-zinc-300 print:text-gray-800">
            <p><strong className="text-zinc-400 print:text-gray-500">Name:</strong> {receipt.customerName}</p>
            {receipt.customer && (
              <>
                <p><strong className="text-zinc-400 print:text-gray-500">Email:</strong> {receipt.customer.email || "-"}</p>
                <p><strong className="text-zinc-400 print:text-gray-500">Phone:</strong> {receipt.customer.phoneNumber || "-"}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm print:bg-white print:border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-white print:text-white">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-zinc-300 print:text-gray-800">
            <div className="flex justify-between border-b border-zinc-800/50 print:border-gray-200 pb-2">
              <span className="text-zinc-400 print:text-gray-500">Method:</span>
              <span className="font-medium text-white print:text-white">{receipt.paymentMethod || "Cash"}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/50 print:border-gray-200 py-2">
              <span className="text-zinc-400 print:text-gray-500">Ref Quotation:</span>
              <span className="font-medium">Q-{receipt.quotationNo?.toString().padStart(5, '0') || "-"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm print:bg-white print:border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-white print:text-white">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800/50 print:border-gray-300 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/50 print:bg-gray-100">
                <TableRow className="border-zinc-800/50 print:border-gray-300">
                  <TableHead className="text-zinc-400 print:text-gray-600">Code</TableHead>
                  <TableHead className="text-zinc-400 print:text-gray-600">Description</TableHead>
                  <TableHead className="text-zinc-400 print:text-gray-600 text-right">Qty</TableHead>
                  <TableHead className="text-zinc-400 print:text-gray-600 text-right">Disc (%)</TableHead>
                  <TableHead className="text-zinc-400 print:text-gray-600 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.details?.map((item: any) => (
                  <TableRow key={item.id} className="border-zinc-800/50 print:border-gray-200">
                    <TableCell className="font-medium text-white print:text-white">{item.itemCode || "-"}</TableCell>
                    <TableCell className="text-zinc-300 print:text-gray-800">{item.itemDescription}</TableCell>
                    <TableCell className="text-right text-zinc-300 print:text-gray-800">{item.quantity}</TableCell>
                    <TableCell className="text-right text-zinc-400 print:text-gray-500">{item.discountPct}%</TableCell>
                    <TableCell className="text-right text-emerald-400 print:text-emerald-700 font-medium">
                      {formatCurrency(settings.currency === 'LKR' ? item.lineTotalLkr : item.lineTotalUsd, settings.currency)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 border-zinc-700 print:border-gray-400 bg-zinc-900/30 print:bg-gray-50">
                  <TableCell colSpan={4} className="text-right font-bold text-white print:text-white">TOTAL PAID ({settings.currency}):</TableCell>
                  <TableCell className="text-right font-bold text-emerald-400 print:text-emerald-700 text-lg">
                    {formatCurrency(settings.currency === 'LKR' ? receipt.totalPaidLkr : receipt.totalPaidUsd, settings.currency)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
