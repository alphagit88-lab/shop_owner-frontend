"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Printer, CheckCircle, Edit } from "lucide-react";
import { toast } from "sonner";

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuotation = async () => {
    try {
      const res = await api.get(`/quotations/${params.no}`);
      setQuotation(res.data);
    } catch (error) {
      toast.error("Failed to fetch quotation details");
      router.push("/dashboard/quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [params.no]);

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading...</div>;
  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleEmailPdf = async () => {
    const email = prompt("Enter customer email address:", quotation.customer?.email || "");
    if (!email) return;
    
    try {
      await api.post(`/quotations/${quotation.quotationNo}/email`, { email });
      toast.success("Quotation sent successfully!");
      fetchQuotation();
    } catch (error) {
      toast.error("Failed to send quotation email");
    }
  };

  const handleConvertToReceipt = async () => {
    const paymentMethod = prompt("Enter payment method (e.g. Cash, Card, Bank Transfer):", "Cash");
    if (!paymentMethod) return;

    try {
      await api.post(`/quotations/${quotation.quotationNo}/convert`, { paymentMethod });
      toast.success("Converted to Receipt successfully!");
      router.push("/dashboard/receipts");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to convert to receipt");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/quotations")} className="text-zinc-400 hover:text-white hover:bg-white/10 print:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Quotation Q-{quotation.quotationNo.toString().padStart(5, '0')}
              <Badge variant="outline" className={
                quotation.status === "DRAFT" ? "border-zinc-500/30 text-zinc-400 bg-zinc-500/10" :
                quotation.status === "SENT" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
              }>
                {quotation.status}
              </Badge>
            </h2>
            <p className="text-zinc-500">{new Date(quotation.quotationDate).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          {quotation.status !== "CONVERTED" && (
            <Button variant="outline" onClick={() => router.push(`/dashboard/quotations/new?edit=${quotation.quotationNo}`)} className="border-zinc-700 bg-black/40 text-white hover:bg-amber-400/10 hover:text-amber-400 hover:border-amber-400/50">
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint} className="border-zinc-700 bg-black/40 text-white hover:bg-white/10">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button variant="outline" onClick={handleEmailPdf} className="border-zinc-700 bg-black/40 text-white hover:bg-blue-400/10 hover:text-blue-400 hover:border-blue-400/50">
            <Mail className="w-4 h-4 mr-2" /> Email PDF
          </Button>
          {quotation.status !== "CONVERTED" && (
            <Button onClick={handleConvertToReceipt} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
              <CheckCircle className="w-4 h-4 mr-2" /> Convert to Receipt
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
        <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm print:bg-white print:border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-white print:text-black">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-zinc-300 print:text-gray-800">
            <p><strong className="text-zinc-400 print:text-gray-500">Customer ID:</strong> <span className="font-mono text-zinc-500">#{quotation.customerId}</span></p>
            <p><strong className="text-zinc-400 print:text-gray-500">Name:</strong> {quotation.customerName}</p>
            {quotation.customer && (
              <>
                <p><strong className="text-zinc-400 print:text-gray-500">Email:</strong> {quotation.customer.email || "-"}</p>
                <p><strong className="text-zinc-400 print:text-gray-500">Phone:</strong> {quotation.customer.phoneNumber || "-"}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm print:bg-white print:border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-white print:text-black">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-zinc-300 print:text-gray-800">
            <div className="flex justify-between">
              <span className="text-zinc-400 print:text-gray-500">Total Items:</span>
              <span>{quotation.details?.length || 0}</span>
            </div>
            {quotation.notes && (
              <div className="mt-4 pt-4 border-t border-zinc-800/50 print:border-gray-200">
                <p className="text-sm text-zinc-400 print:text-gray-500">Notes:</p>
                <p className="text-sm italic">{quotation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm print:bg-white print:border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-white print:text-black">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800/50 print:border-gray-300 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/50 print:bg-gray-100">
                <TableRow className="border-zinc-800/50 print:border-gray-300">
                  <TableHead className="text-zinc-400 print:text-gray-600">Code</TableHead>
                  <TableHead className="text-zinc-400 print:text-gray-600">Description</TableHead>
                  <TableHead className="text-zinc-400 print:text-gray-600 text-right">Qty</TableHead>
                  <TableHead className="text-zinc-400 print:text-gray-600 text-right">Base (USD)</TableHead>
                  <TableHead className="text-zinc-400 print:text-gray-600 text-right">Disc. (USD)</TableHead>
                  <TableHead className="text-zinc-400 print:text-gray-600 text-right">Total (USD)</TableHead>
                  <TableHead className="text-zinc-400 print:text-gray-600 text-right">Total (LKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.details?.map((item: any) => (
                  <TableRow key={item.id} className="border-zinc-800/50 print:border-gray-200">
                    <TableCell className="font-medium text-white print:text-black">{item.itemCode || "-"}</TableCell>
                    <TableCell className="text-zinc-300 print:text-gray-800">{item.itemDescription}</TableCell>
                    <TableCell className="text-right text-zinc-300 print:text-gray-800">{item.quantity}</TableCell>
                    <TableCell className="text-right text-zinc-400 print:text-gray-600">${Number(item.unitPriceUsd).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-red-400 print:text-red-600">-${Number(item.discountAmountUsd).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-emerald-400 print:text-emerald-700 font-medium">${Number(item.lineTotalUsd).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-amber-400 print:text-orange-700 font-medium">Rs.{Number(item.lineTotalLkr).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 border-zinc-700 print:border-gray-400 bg-zinc-900/30 print:bg-gray-50">
                  <TableCell colSpan={5} className="text-right font-bold text-white print:text-black">GRAND TOTAL:</TableCell>
                  <TableCell className="text-right font-bold text-emerald-400 print:text-emerald-700 text-lg">${Number(quotation.totalUsd).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-amber-500 print:text-orange-700 text-lg">Rs.{Number(quotation.totalLkr).toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
