"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2, ArrowLeft, Gem, Check, ChevronsUpDown, ShoppingBag, UserPlus, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings-context";
import { formatCurrency } from "@/lib/format";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
  phoneNumber?: string;
  email?: string;
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
  const { settings } = useSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectItemId = searchParams.get("item");
  const preselectCustomerId = searchParams.get("customer");
  const editQuotationNo = searchParams.get("edit");

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [quotationStatus, setQuotationStatus] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [itemSelectKey, setItemSelectKey] = useState(0);

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

        if (preselectCustomerId) {
          setSelectedCustomerId(preselectCustomerId);
        }

        if (preselectItemId && !editQuotationNo) {
          const item = inStockItems.find((i: Item) => i.id === Number(preselectItemId));
          if (item) {
            handleAddLineItem(item);
          }
        }

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

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    
    try {
      setLoading(true);
      const res = await api.post("/customers", {
        customerName: newCustomerName,
        phoneNumber: newCustomerPhone,
        email: newCustomerEmail,
      });
      const createdCustomer = res.data;
      setCustomers(prev => [...prev, createdCustomer]);
      setSelectedCustomerId(createdCustomer.id.toString());
      setIsNewCustomerOpen(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerEmail("");
      toast.success("Customer created successfully");
    } catch (error) {
      toast.error("Failed to create customer");
    } finally {
      setLoading(false);
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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-400 hover:text-white hover:bg-white/10 shrink-0 h-9 w-9">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white truncate">
            {editQuotationNo ? `Edit Quotation Q-${editQuotationNo.toString().padStart(5, '0')}` : "Pricing & Quotation"}
          </h2>
          <p className="text-xs text-zinc-500">
            {editQuotationNo ? "Modify this quotation's items and pricing." : "Create a new price quote for a customer."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Config Col */}
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customer" className="text-xs text-zinc-300">Customer *</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsNewCustomerOpen(true)}
                    className="h-7 px-2 text-[10px] bg-blue-500/5 border-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1.5"
                  >
                    <Plus className="w-3 h-3" /> Quick Add
                  </Button>
                </div>
                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                  <PopoverTrigger render={
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerOpen}
                      className="w-full justify-between bg-black/40 border-zinc-800 text-white hover:bg-black/60 hover:text-white h-10 text-sm"
                    />
                  }>
                    <span className="truncate">
                      {selectedCustomerId && customers.find((c) => c.id.toString() === selectedCustomerId)
                        ? customers.find((c) => c.id.toString() === selectedCustomerId)?.customerName
                        : "Select Customer..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-zinc-950 border-zinc-800" align="start">
                    <Command className="bg-zinc-950 text-white">
                      <CommandInput placeholder="Search name or phone..." className="text-white h-10" />
                      <CommandList>
                        <div className="p-1 border-b border-zinc-800/50">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full justify-start text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-10 px-3 text-xs font-semibold gap-2"
                            onClick={() => {
                              setCustomerOpen(false);
                              setIsNewCustomerOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4" /> Add New Customer
                          </Button>
                        </div>
                        <CommandEmpty>
                          <div className="flex flex-col items-center justify-center p-4">
                            <p className="text-zinc-500 text-sm mb-3">No customer found.</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
                              onClick={() => {
                                setCustomerOpen(false);
                                setIsNewCustomerOpen(true);
                              }}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add New
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {customers.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.id}-${c.customerName}-${c.phoneNumber || ""}`}
                              onSelect={(currentValue) => {
                                const id = currentValue.split('-')[0];
                                setSelectedCustomerId(id === selectedCustomerId ? "" : id);
                                setCustomerOpen(false);
                              }}
                              className="text-white hover:bg-zinc-800 aria-selected:bg-zinc-800 cursor-pointer text-sm py-2"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCustomerId === c.id.toString() ? "opacity-100 text-blue-500" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{c.customerName}</span>
                                {c.phoneNumber && <span className="text-[10px] text-zinc-500">{c.phoneNumber}</span>}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected Customer Details */}
                {selectedCustomerId && customers.find(c => c.id.toString() === selectedCustomerId) && (
                  <div className="p-3 rounded-xl border border-zinc-800/50 bg-black/20 space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-blue-500" />
                      </div>
                      <span className="text-sm font-semibold">{customers.find(c => c.id.toString() === selectedCustomerId)?.customerName}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 pl-8">
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{customers.find(c => c.id.toString() === selectedCustomerId)?.phoneNumber || "No phone added"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <Mail className="w-3 h-3 text-zinc-500" />
                        <span className="truncate">{customers.find(c => c.id.toString() === selectedCustomerId)?.email || "No email added"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs text-zinc-300">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Terms, sizing, or delivery notes..."
                  className="bg-black/40 border-zinc-800 text-white min-h-[80px] text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 backdrop-blur-sm">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-semibold text-blue-500 uppercase tracking-widest">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>Items Subtotal:</span>
                <span className="font-medium text-white">{lineItems.length} items</span>
              </div>
              <div className="pt-4 border-t border-blue-500/20">
                <div className="space-y-1">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Grand Total ({settings.currency})</p>
                  <p className="text-3xl font-bold text-white tracking-tight">
                    {formatCurrency(totals.lkr, 'LKR')}
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleSaveQuotation}
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold h-11 shadow-lg shadow-blue-500/20"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : editQuotationNo ? "Update" : "Save Quotation"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Line Items Col */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm min-h-full">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/50">
              <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Line Items
              </CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <Select key={`item-select-${itemSelectKey}`} onValueChange={(val) => {
                  if (val) {
                    const item = availableItems.find(i => i.id.toString() === val);
                    handleAddLineItem(item);
                    setTimeout(() => setItemSelectKey(prev => prev + 1), 50);
                  }
                }}>
                  <SelectTrigger className="flex-1 sm:w-[180px] bg-blue-500/10 border-blue-500/20 text-white text-xs h-9">
                    <SelectValue placeholder="Add Item" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    {availableItems.map(item => (
                      <SelectItem key={item.id} value={item.id.toString()} className="text-sm">{item.itemCode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => handleAddLineItem()} className="border-zinc-700 bg-black/40 text-white h-9 px-3 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Custom
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {lineItems.length === 0 ? (
                <div className="text-center py-20">
                  <Gem className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                  <p className="text-zinc-500 text-sm">Add items from inventory to begin.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lineItems.map((li) => (
                    <div key={li.id} className="group p-4 rounded-xl border border-zinc-800/50 bg-black/20 hover:border-zinc-700 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="min-w-0 flex-1 mr-4">
                          <Input 
                            value={li.itemCode} 
                            placeholder="Item Code"
                            onChange={(e) => updateLineItem(li.id, 'itemCode', e.target.value)}
                            className="bg-transparent border-none p-0 h-auto text-white font-bold text-base focus-visible:ring-0 placeholder:text-zinc-700"
                          />
                          <Input 
                            value={li.itemDescription} 
                            placeholder="Description"
                            onChange={(e) => updateLineItem(li.id, 'itemDescription', e.target.value)}
                            className="bg-transparent border-none p-0 h-auto text-zinc-500 text-xs focus-visible:ring-0 placeholder:text-zinc-800"
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeLineItem(li.id)}
                          className="h-8 w-8 text-zinc-600 hover:text-red-400 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-zinc-800/30">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-zinc-500 uppercase font-bold">Qty</Label>
                          <Input 
                            type="number" min="1"
                            value={li.quantity} 
                            onChange={(e) => updateLineItem(li.id, 'quantity', e.target.value)}
                            className="bg-zinc-900/50 border-zinc-800 h-8 text-sm text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-zinc-500 uppercase font-bold">Price ({settings.currency})</Label>
                          <Input 
                            type="number"
                            value={li.unitPriceLkr} 
                            onChange={(e) => updateLineItem(li.id, 'unitPriceLkr', e.target.value)}
                            className="bg-zinc-900/50 border-zinc-800 h-8 text-sm text-emerald-400 font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-zinc-500 uppercase font-bold">Disc %</Label>
                          <Input 
                            type="number"
                            value={li.discountPct} 
                            onChange={(e) => updateLineItem(li.id, 'discountPct', e.target.value)}
                            className="bg-zinc-900/50 border-zinc-800 h-8 text-sm text-red-400 font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-zinc-500 uppercase font-bold text-right block">Subtotal</Label>
                          <div className="h-8 flex items-center justify-end text-sm font-bold text-white px-2">
                            {formatCurrency(
                              ((settings.currency === 'LKR' ? li.unitPriceLkr : li.unitPriceUsd) * (1 - li.discountPct / 100)) * li.quantity,
                              settings.currency
                            )}
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

      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="John Doe"
                className="bg-black/40 border-zinc-800 text-white h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className="bg-black/40 border-zinc-800 text-white h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="bg-black/40 border-zinc-800 text-white h-10"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsNewCustomerOpen(false)} className="flex-1 sm:flex-none border-zinc-800 text-white hover:bg-zinc-800">
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} disabled={loading} className="flex-1 sm:flex-none bg-blue-500 text-white hover:bg-blue-600">
              {loading ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
