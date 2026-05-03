"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Eye, CheckCircle, Mail, Edit, Printer } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSettings } from "@/lib/settings-context";
import { formatCurrency } from "@/lib/format";

interface Quotation {
  quotationNo: number;
  quotationDate: string;
  customerName: string;
  totalUsd: string;
  totalLkr: string;
  status: string;
}

export default function QuotationsPage() {
  const { settings } = useSettings();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/quotations");
      setQuotations(res.data);
    } catch (error) {
      toast.error("Failed to fetch quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleEmailPdf = async (no: number, email: string) => {
    if (!email) {
      const inputEmail = prompt("Enter customer email address:");
      if (!inputEmail) return;
      email = inputEmail;
    }
    
    try {
      await api.post(`/quotations/${no}/email`, { email });
      toast.success("Quotation sent successfully!");
      fetchQuotations();
    } catch (error) {
      toast.error("Failed to send quotation email");
    }
  };

  const handlePrintPdf = async (no: number) => {
    try {
      const res = await api.get(`/quotations/${no}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast.error("Failed to open PDF for printing");
    }
  };

  const handleConvertToReceipt = async (no: number) => {
    const paymentMethod = prompt("Enter payment method (e.g. Cash, Card, Bank Transfer):", "Cash");
    if (!paymentMethod) return;

    try {
      await api.post(`/quotations/${no}/convert`, { paymentMethod });
      toast.success("Converted to Receipt successfully!");
      fetchQuotations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to convert to receipt");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Quotations</h2>
          <p className="text-zinc-500">Manage price quotes, email PDFs, and convert them to sales receipts.</p>
        </div>
        
        <Button onClick={() => router.push("/dashboard/quotations/new")} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Quotation
        </Button>
      </div>

      <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="rounded-md border border-zinc-800/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800/50 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Quote No.</TableHead>
                  <TableHead className="text-zinc-400">Date</TableHead>
                  <TableHead className="text-zinc-400">Customer</TableHead>
                  <TableHead className="text-zinc-400 text-right">Total</TableHead>
                  <TableHead className="text-zinc-400 text-center">Status</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="border-zinc-800/50">
                    <TableCell colSpan={7} className="text-center py-8 text-zinc-500">Loading quotations...</TableCell>
                  </TableRow>
                ) : quotations.length === 0 ? (
                  <TableRow className="border-zinc-800/50">
                    <TableCell colSpan={7} className="text-center py-8 text-zinc-500">No quotations found</TableCell>
                  </TableRow>
                ) : (
                  quotations.map((quote) => (
                    <TableRow key={quote.quotationNo} className="border-zinc-800/50 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-zinc-500" />
                          Q-{quote.quotationNo.toString().padStart(5, '0')}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-300">{new Date(quote.quotationDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-white font-medium">{quote.customerName}</TableCell>
                      <TableCell className="text-right text-emerald-400 font-medium">
                        {formatCurrency(settings.currency === 'LKR' ? quote.totalLkr : quote.totalUsd, settings.currency)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={
                          quote.status === "DRAFT" ? "border-zinc-500/30 text-zinc-400 bg-zinc-500/10" :
                          quote.status === "SENT" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                          "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                        }>
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {quote.status !== "CONVERTED" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10"
                              onClick={() => router.push(`/dashboard/quotations/new?edit=${quote.quotationNo}`)}
                              title="Edit Quotation"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
                            onClick={() => router.push(`/dashboard/quotations/${quote.quotationNo}`)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10"
                            onClick={() => handleEmailPdf(quote.quotationNo, "")}
                            title="Email PDF"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10"
                            onClick={() => handlePrintPdf(quote.quotationNo)}
                            title="Print PDF Quotation"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          {quote.status !== "CONVERTED" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                              onClick={() => handleConvertToReceipt(quote.quotationNo)}
                              title="Convert to Receipt (Sale)"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
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

