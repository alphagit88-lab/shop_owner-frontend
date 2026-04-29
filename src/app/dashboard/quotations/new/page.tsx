"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2, ArrowLeft, Gem } from "lucide-react";
import { toast } from "sonner";

interface Item {
  id: number;
  itemCode: string;
  itemDescription: string;
  unitPriceUsd: number;
  unitPriceLkr: number;
  isAvailable: boolean;
}

interface Customer {
  id: number;
  customerName: string;
}

interface LineItem {
  id: string;
  itemId?: number;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  unitPriceUsd: number;
  unitPriceLkr: number;
  discountPct: number;
}

const USD_LKR_RATE = 319.36;

export default function NewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectItemId = searchParams.get("item");
  const preselectCustomerId = searchParams.get("customer");
  const editQuotationNo = searchParams.get("edit"); // Gap 3: editing mode

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [quotationStatus, setQuotationStatus] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, itemsRes] = await Promise.all([
          api.get("/customers"),
          api.get("/items")
        ]);
        setCustomers(custRes.data);
        
        const inStockItems = itemsRes.data.filter((i: Item) => i.isAvailable);
        setAvailableItems(inStockItems);

        // Gap 2: Auto-select customer from pricing modal
        if (preselectCustomerId) {
          setSelectedCustomerId(preselectCustomerId);
        }

        // Auto-add item if navigated from Items page
        if (preselectItemId && !editQuotationNo) {
          const item = inStockItems.find((i: Item) => i.id === Number(preselectItemId));
          if (item) {
            handleAddLineItem(item);
          }
        }

        // Gap 3: Load existing quotation for editing
        if (editQuotationNo) {
          const quoteRes = await api.get(`/quotations/${editQuotationNo}`);
          const quote = quoteRes.data;
          setQuotationStatus(quote.status);
          setSelectedCustomerId(quote.customerId?.toString() || "");
          setNotes(quote.notes || "");
          setLineItems(
            quote.details.map((d: any) => ({
              id: Math.random().toString(),
              itemId: d.itemId || undefined,
              itemCode: d.itemCode || "",
              itemDescription: d.itemDescription || "",
              quantity: d.quantity,
              unitPriceUsd: Number(d.unitPriceUsd),
              unitPriceLkr: Number(d.unitPriceLkr),
              discountPct: Number(d.discountPct),
            }))
          );
        }
      } catch (err) {
        toast.error("Failed to load initial data");
      }
    };
    fetchData();
  }, [preselectItemId, preselectCustomerId, editQuotationNo]);

  const handleAddLineItem = (item?: Item) => {
    if (item) {
      if (lineItems.find(li => li.itemId === item.id)) {
        toast.warning("Item already added to quote.");
        return;
      }
      setLineItems([
        ...lineItems,
        {
          id: Math.random().toString(),
          itemId: item.id,
          itemCode: item.itemCode,
          itemDescription: item.itemDescription,
          quantity: 1,
          unitPriceUsd: item.unitPriceUsd,
          unitPriceLkr: item.unitPriceLkr,
          discountPct: 0,
        }
      ]);
    } else {
      setLineItems([
        ...lineItems,
        {
          id: Math.random().toString(),
          itemCode: "",
          itemDescription: "",
          quantity: 1,
          unitPriceUsd: 0,
          unitPriceLkr: 0,
          discountPct: 0,
        }
      ]);
    }
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(li => li.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(li => {
      if (li.id !== id) return li;
      
      const updated = { ...li, [field]: value };
      
      if (field === 'unitPriceUsd') {
        updated.unitPriceLkr = Number(value) * USD_LKR_RATE;
      }
      if (field === 'unitPriceLkr') {
        updated.unitPriceUsd = Number(value) / USD_LKR_RATE;
      }
      
      if (field === 'discountPct') {
        updated.discountPct = Number(value) || 0;
      }

      return updated;
    }));
  };

  const totals = useMemo(() => {
    let usd = 0;
    let lkr = 0;
    lineItems.forEach(li => {
      const unitUsd = Number(li.unitPriceUsd) || 0;
      const unitLkr = Number(li.unitPriceLkr) || 0;
      const pct = Number(li.discountPct) || 0;
      const qty = Number(li.quantity) || 0;

      const discUsd = (unitUsd * pct) / 100;
      const discLkr = (unitLkr * pct) / 100;

      usd += (unitUsd - discUsd) * qty;
      lkr += (unitLkr - discLkr) * qty;
    });
    return { usd, lkr };
  }, [lineItems]);

  const handleSaveQuotation = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer.");
      return;
    }
    if (lineItems.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }

    const customer = customers.find(c => c.id === Number(selectedCustomerId));

    const payload = {
      customerId: customer?.id,
      customerName: customer?.customerName,
      notes,
      details: lineItems.map(li => ({
        ...li,
        unitPriceUsd: Number(li.unitPriceUsd),
        unitPriceLkr: Number(li.unitPriceLkr),
        quantity: Number(li.quantity),
        discountPct: Number(li.discountPct),
      }))
    };

    try {
      setLoading(true);
      if (editQuotationNo) {
        // Gap 3: Update existing
        await api.put(`/quotations/${editQuotationNo}`, payload);
        toast.success("Quotation updated successfully!");
      } else {
        await api.post("/quotations", payload);
        toast.success("Quotation created successfully!");
      }
      router.push("/dashboard/quotations");
    } catch (error) {
      toast.error("Failed to save quotation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-400 hover:text-white hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {editQuotationNo ? `Edit Quotation Q-${editQuotationNo.toString().padStart(5, '0')}` : "Pricing & Quotation"}
          </h2>
          <p className="text-zinc-500">
            {editQuotationNo ? "Modify this quotation's items, pricing, and discounts." : "Create a new price quote for a customer."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col - Config */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white">Quotation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer" className="text-zinc-300">Select Customer *</Label>
                <Select value={selectedCustomerId} onValueChange={(val) => setSelectedCustomerId(val || "")}>
                  <SelectTrigger className="bg-black/40 border-zinc-800 text-white">
                    <SelectValue placeholder="Choose a customer..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        <span className="font-mono text-zinc-500 text-xs mr-2">#{c.id}</span>
                        {c.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customers.length === 0 && <p className="text-xs text-amber-500">No customers found. Create one first.</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-zinc-300">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details..."
                  className="bg-black/40 border-zinc-800 text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-amber-500">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-zinc-300">
                <span>Total Items:</span>
                <span className="font-medium text-white">{lineItems.length}</span>
              </div>
              <div className="pt-4 border-t border-amber-500/20">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-zinc-400">Total (USD)</span>
                  <span className="text-3xl font-bold text-white">${totals.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-sm text-zinc-400">Total (LKR)</span>
                  <span className="text-xl font-medium text-amber-500">Rs. {totals.lkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Button 
                onClick={handleSaveQuotation}
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold h-12 shadow-lg shadow-amber-500/20"
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? "Saving..." : editQuotationNo ? "Update Quotation" : "Save & Generate Quote"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Col - Line Items */}
        <div className="md:col-span-2">
          <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm min-h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/50">
              <CardTitle className="text-lg text-white">Line Items</CardTitle>
              <div className="flex gap-2">
                <Select onValueChange={(val) => {
                  if (val) {
                    const item = availableItems.find(i => i.id.toString() === val);
                    handleAddLineItem(item);
                  }
                }}>
                  <SelectTrigger className="w-[180px] bg-amber-500/10 border-amber-500/20 text-white hover:bg-amber-500/20 transition-colors">
                    <SelectValue placeholder="Add Inventory Item" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    {availableItems.map(item => (
                      <SelectItem key={item.id} value={item.id.toString()}>{item.itemCode || item.itemDescription}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => handleAddLineItem()} className="border-zinc-700 bg-black/40 text-white hover:bg-white/10">
                  <Plus className="w-4 h-4 mr-2" /> Custom Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {lineItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                    <Gem className="w-8 h-8 text-zinc-700" />
                  </div>
                  <p className="text-zinc-500">No items added to this quotation yet.</p>
                  <p className="text-sm text-zinc-600 mt-1">Select an item from inventory or add a custom item.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {lineItems.map((li) => (
                    <div key={li.id} className="p-4 rounded-xl border border-zinc-800 bg-black/20 space-y-4 relative group">
                      <button 
                        onClick={() => removeLineItem(li.id)}
                        className="absolute top-4 right-4 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-3">
                          <Label className="text-xs text-zinc-500 uppercase tracking-wider">Item Code</Label>
                          <Input 
                            value={li.itemCode} 
                            onChange={(e) => updateLineItem(li.id, 'itemCode', e.target.value)}
                            className="bg-white/5 border-zinc-800 mt-1 text-white disabled:text-white/60 disabled:bg-white/10"
                            disabled={!!li.itemId}
                          />
                        </div>
                        <div className="col-span-12 md:col-span-7">
                          <Label className="text-xs text-zinc-500 uppercase tracking-wider">Description</Label>
                          <Input 
                            value={li.itemDescription} 
                            onChange={(e) => updateLineItem(li.id, 'itemDescription', e.target.value)}
                            className="bg-white/5 border-zinc-800 mt-1 text-white disabled:text-white/60 disabled:bg-white/10"
                            disabled={!!li.itemId}
                          />
                        </div>
                        <div className="col-span-12 md:col-span-2">
                          <Label className="text-xs text-zinc-500 uppercase tracking-wider">Qty</Label>
                          <Input 
                            type="number" min="1"
                            value={li.quantity} 
                            onChange={(e) => updateLineItem(li.id, 'quantity', e.target.value)}
                            className="bg-white/5 border-zinc-800 mt-1 text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-4 items-end bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                        <div className="col-span-6 md:col-span-3">
                          <Label className="text-xs text-zinc-400">Base Price (USD)</Label>
                          <Input 
                            type="number"
                            value={li.unitPriceUsd} 
                            onChange={(e) => updateLineItem(li.id, 'unitPriceUsd', e.target.value)}
                            className="bg-black/50 border-zinc-700 mt-1 text-emerald-400 font-medium disabled:text-emerald-400/60 disabled:bg-black/80"
                            disabled={!!li.itemId}
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3">
                          <Label className="text-xs text-zinc-400">Base Price (LKR)</Label>
                          <Input 
                            type="number"
                            value={li.unitPriceLkr} 
                            onChange={(e) => updateLineItem(li.id, 'unitPriceLkr', e.target.value)}
                            className="bg-black/50 border-zinc-700 mt-1 text-emerald-400 font-medium disabled:text-emerald-400/60 disabled:bg-black/80"
                            disabled={!!li.itemId}
                          />
                        </div>
                        <div className="col-span-6 md:col-span-2">
                          <Label className="text-xs text-zinc-400">Discount (%)</Label>
                          <Input 
                            type="number"
                            value={li.discountPct} 
                            onChange={(e) => updateLineItem(li.id, 'discountPct', e.target.value)}
                            className="bg-black/50 border-zinc-700 mt-1 text-red-400 font-bold"
                          />
                        </div>
                        <div className="col-span-12 md:col-span-4 text-right">
                          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Line Total</div>
                          <div className="text-2xl font-bold text-white">
                            ${((Number(li.unitPriceUsd) - (Number(li.unitPriceUsd) * (Number(li.discountPct) || 0) / 100)) * Number(li.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-sm text-amber-500">
                            Rs. {((Number(li.unitPriceLkr) - (Number(li.unitPriceLkr) * (Number(li.discountPct) || 0) / 100)) * Number(li.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
