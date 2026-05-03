"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Printer, CheckCircle, Edit, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings-context";
import { formatCurrency } from "@/lib/format";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function QuotationDetailPage() {
  const { settings } = useSettings();
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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/quotations")} className="text-zinc-400 hover:text-white hover:bg-white/10 print:hidden shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
              <span className="truncate">Q-{quotation.quotationNo.toString().padStart(5, '0')}</span>
              <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${
                quotation.status === "DRAFT" ? "border-zinc-500/30 text-zinc-400 bg-zinc-500/10" :
                quotation.status === "SENT" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
              }`}>
                {quotation.status}
              </Badge>
            </h2>
            <p className="text-xs text-zinc-500">{new Date(quotation.quotationDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Action Buttons - Desktop */}
        <div className="hidden sm:flex gap-2 print:hidden">
          {quotation.status !== "CONVERTED" && (
            <Button variant="outline" onClick={() => router.push(`/dashboard/quotations/new?edit=${quotation.quotationNo}`)} className="border-zinc-700 bg-black/40 text-white hover:bg-blue-400/10 hover:text-blue-400">
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint} className="border-zinc-700 bg-black/40 text-white hover:bg-white/10">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button variant="outline" onClick={handleEmailPdf} className="border-zinc-700 bg-black/40 text-white hover:bg-blue-400/10 hover:text-blue-400">
            <Mail className="w-4 h-4 mr-2" /> Email
          </Button>
          {quotation.status !== "CONVERTED" && (
            <Button onClick={handleConvertToReceipt} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
              <CheckCircle className="w-4 h-4 mr-2" /> Convert
            </Button>
          )}
        </div>

        {/* Action Buttons - Mobile */}
        <div className="flex sm:hidden gap-2 print:hidden">
          {quotation.status !== "CONVERTED" && (
            <Button onClick={handleConvertToReceipt} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs h-9">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Convert to Receipt
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-zinc-700 bg-black/40 text-white h-9 w-9">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-white">
              {quotation.status !== "CONVERTED" && (
                <DropdownMenuItem onClick={() => router.push(`/dashboard/quotations/new?edit=${quotation.quotationNo}`)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit Quotation
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Print PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEmailPdf}>
                <Mail className="w-4 h-4 mr-2" /> Email PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              <p className="text-white font-medium">{quotation.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Customer ID</p>
                <p className="text-zinc-400 font-mono">#{quotation.customerId}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Phone</p>
                <p className="text-zinc-400 truncate">{quotation.customer?.phoneNumber || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm print:bg-white print:border-gray-200">
          <CardHeader className="py-4">
            <CardTitle className="text-base text-zinc-400 uppercase tracking-wider font-semibold">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-300 print:text-gray-800">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Grand Total</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(quotation.totalLkr, 'LKR')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Items</p>
                <p className="text-white font-medium">{quotation.details?.length || 0} Line Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm print:bg-white print:border-gray-200">
        <CardHeader className="py-4">
          <CardTitle className="text-base text-zinc-400 uppercase tracking-wider font-semibold">Line Items</CardTitle>
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
                    {quotation.details?.map((item: any) => (
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

          {quotation.notes && (
            <div className="mt-6 px-4 md:px-0">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Internal Notes</p>
              <div className="p-4 rounded-xl border border-zinc-800 bg-black/20 text-zinc-400 text-sm italic">
                {quotation.notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
