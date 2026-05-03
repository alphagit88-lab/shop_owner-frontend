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
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Quotations</h2>
          <p className="text-zinc-500 text-sm md:text-base">Manage price quotes and sales conversions.</p>
        </div>
        
        <Button onClick={() => router.push("/dashboard/quotations/new")} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Quotation
        </Button>
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
                      <TableHead className="text-zinc-400 text-center">Status</TableHead>
                      <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow className="border-zinc-800/50">
                        <TableCell colSpan={5} className="text-center py-8 text-zinc-500">Loading...</TableCell>
                      </TableRow>
                    ) : quotations.length === 0 ? (
                      <TableRow className="border-zinc-800/50">
                        <TableCell colSpan={5} className="text-center py-8 text-zinc-500">No quotations found</TableCell>
                      </TableRow>
                    ) : (
                      quotations.map((quote) => (
                        <TableRow key={quote.quotationNo} className="border-zinc-800/50 hover:bg-white/5 transition-colors">
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 font-medium text-white text-sm">
                                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                                Q-{quote.quotationNo.toString().padStart(5, '0')}
                              </div>
                              <span className="text-[10px] text-zinc-500 ml-5">
                                {new Date(quote.quotationDate).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white font-medium text-sm truncate max-w-[80px] md:max-w-none">
                            {quote.customerName}
                          </TableCell>
                          <TableCell className="text-right text-emerald-400 font-bold text-sm whitespace-nowrap">
                            {formatCurrency(quote.totalLkr, 'LKR')}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[10px] h-5 px-1 ${
                              quote.status === "DRAFT" ? "border-zinc-500/30 text-zinc-400 bg-zinc-500/10" :
                              quote.status === "SENT" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                              "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                            }`}>
                              {quote.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 md:gap-2">
                              {quote.status !== "CONVERTED" && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-zinc-400 hover:text-blue-400"
                                  onClick={() => router.push(`/dashboard/quotations/new?edit=${quote.quotationNo}`)}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-zinc-400 hover:text-white"
                                onClick={() => router.push(`/dashboard/quotations/${quote.quotationNo}`)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-zinc-400 hover:text-emerald-400"
                                onClick={() => handleConvertToReceipt(quote.quotationNo)}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
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
