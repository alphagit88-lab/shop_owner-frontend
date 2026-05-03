"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, DollarSign, Mail, Phone, User, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSettings } from "@/lib/settings-context";
import { formatCurrency } from "@/lib/format";

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
  phoneNumber: string;
  email: string;
}

const USD_LKR_RATE = 319.36;

export default function ItemsPage() {
  const { settings } = useSettings();
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingItemId, setPricingItemId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");

  const [formData, setFormData] = useState({
    itemCode: "",
    itemDescription: "",
    unitPriceUsd: "",
    unitPriceLkr: "",
  });

  const router = useRouter();

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/items${search ? `?search=${search}` : ""}`);
      setItems(res.data);
    } catch (error) {
      toast.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleOpenDialog = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        itemCode: item.itemCode || "",
        itemDescription: item.itemDescription,
        unitPriceUsd: item.unitPriceUsd.toString(),
        unitPriceLkr: item.unitPriceLkr.toString(),
      });
    } else {
      setEditingItem(null);
      setFormData({ itemCode: "", itemDescription: "", unitPriceUsd: "", unitPriceLkr: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        itemCode: formData.itemCode,
        itemDescription: formData.itemDescription,
        unitPriceUsd: Number(formData.unitPriceUsd),
        unitPriceLkr: Number(formData.unitPriceLkr),
      };

      if (editingItem) {
        await api.put(`/items/${editingItem.id}`, payload);
        toast.success("Item updated successfully");
      } else {
        await api.post("/items", payload);
        toast.success("Item created successfully");
      }
      setIsDialogOpen(false);
      fetchItems();
    } catch (error) {
      toast.error("Failed to save item");
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/items/${id}`);
      toast.success("Item deleted successfully");
      fetchItems();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to delete item";
      toast.error(message);
    }
  };

  const handleOpenPricingModal = async (itemId: number) => {
    setPricingItemId(itemId);
    setSelectedCustomer(null);
    setCustomerSearch("");
    try {
      const res = await api.get("/customers");
      setCustomers(res.data);
    } catch {
      toast.error("Failed to load customers");
    }
    setIsPricingModalOpen(true);
  };

  const handleProceedToQuotation = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer first.");
      return;
    }
    setIsPricingModalOpen(false);
    router.push(`/dashboard/quotations/new?item=${pricingItemId}&customer=${selectedCustomer.id}`);
  };

  const filteredCustomers = customers.filter(c =>
    c.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phoneNumber?.includes(customerSearch)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Items Catalog</h2>
          <p className="text-zinc-500 text-sm md:text-base">Manage your items, stock and pricing.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          } />
          <DialogContent className="bg-zinc-950 border border-zinc-800 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveItem} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="itemCode">Item Code</Label>
                <Input
                  id="itemCode"
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                  placeholder="e.g. DM-001"
                  className="bg-white/5 border-zinc-800 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemDescription">Description *</Label>
                <Input
                  id="itemDescription"
                  required
                  value={formData.itemDescription}
                  onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                  placeholder="e.g. 1.0ct Round Brilliant"
                  className="bg-white/5 border-zinc-800 focus:ring-blue-500/50"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                {settings.currency !== 'LKR' ? (
                  <div className="space-y-2">
                    <Label htmlFor="unitPriceUsd">Price ({settings.currency}) *</Label>
                    <Input
                      id="unitPriceUsd"
                      type="number"
                      step="0.01"
                      required
                      value={formData.unitPriceUsd}
                      onChange={(e) => {
                        const usd = e.target.value;
                        const lkr = usd ? (Number(usd) * USD_LKR_RATE).toFixed(2) : "";
                        setFormData({ ...formData, unitPriceUsd: usd, unitPriceLkr: lkr });
                      }}
                      className="bg-white/5 border-zinc-800 focus:ring-blue-500/50"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="unitPriceLkr">Price (LKR) *</Label>
                    <Input
                      id="unitPriceLkr"
                      type="number"
                      step="0.01"
                      required
                      value={formData.unitPriceLkr}
                      onChange={(e) => {
                        const lkr = e.target.value;
                        const usd = lkr ? (Number(lkr) / USD_LKR_RATE).toFixed(2) : "";
                        setFormData({ ...formData, unitPriceLkr: lkr, unitPriceUsd: usd });
                      }}
                      className="bg-white/5 border-zinc-800 focus:ring-blue-500/50"
                    />
                  </div>
                )}
              </div>
              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="hover:bg-white/10 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  {editingItem ? "Save Changes" : "Create Item"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isPricingModalOpen} onOpenChange={setIsPricingModalOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-white sm:max-w-[520px] w-[95vw] p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-9 bg-white/5 border-zinc-800 text-white"
              />
            </div>

            <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredCustomers.length === 0 ? (
                <p className="text-center text-zinc-500 py-6 text-sm">No customers found.</p>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${selectedCustomer?.id === customer.id
                      ? "border-blue-500/50 bg-blue-500/10"
                      : "border-zinc-800 bg-black/20 hover:bg-white/5 hover:border-zinc-700"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span className="font-medium text-white truncate">{customer.customerName}</span>
                        </div>
                        <div className="mt-1 pl-6">
                          {customer.email && (
                            <div className="text-[10px] text-zinc-400 truncate">{customer.email}</div>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">
                        #{customer.id}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-zinc-800">
              <Button variant="ghost" onClick={() => setIsPricingModalOpen(false)} className="hover:bg-white/10 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={handleProceedToQuotation}
                disabled={!selectedCustomer}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-40"
              >
                Next Step
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm">
        <CardHeader className="pb-3 px-4 md:px-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-black/40 border-zinc-800 text-white focus:ring-blue-500/50"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle px-4 md:px-0">
              <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-900/50">
                    <TableRow className="border-zinc-800/50 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Item</TableHead>
                      <TableHead className="text-zinc-400 text-right">Price</TableHead>
                      <TableHead className="hidden sm:table-cell text-zinc-400 text-center">Status</TableHead>
                      <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow className="border-zinc-800/50">
                        <TableCell colSpan={4} className="text-center py-8 text-zinc-500">Loading...</TableCell>
                      </TableRow>
                    ) : items.length === 0 ? (
                      <TableRow className="border-zinc-800/50">
                        <TableCell colSpan={4} className="text-center py-8 text-zinc-500">No items found</TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id} className="border-zinc-800/50 hover:bg-white/5 transition-colors">
                          <TableCell className="max-w-[150px] md:max-w-none">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-sm">{item.itemCode || "NO CODE"}</span>
                                <span className={`sm:hidden text-[8px] font-bold px-1 rounded-full border ${item.isAvailable ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" : "border-red-500/30 text-red-500 bg-red-500/10"}`}>
                                  {item.isAvailable ? "IN" : "OUT"}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-500 line-clamp-1 md:line-clamp-none whitespace-normal">
                                {item.itemDescription}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-emerald-400 font-semibold text-sm whitespace-nowrap">
                            {formatCurrency(settings.currency === 'LKR' ? item.unitPriceLkr : item.unitPriceUsd, settings.currency)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-center">
                            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${item.isAvailable ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" : "border-red-500/30 text-red-500 bg-red-500/10"}`}>
                              {item.isAvailable ? "AVAILABLE" : "SOLD OUT"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 md:gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-400 hover:text-blue-400"
                                onClick={() => handleOpenPricingModal(item.id)}
                              >
                                <Banknote className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-400 hover:text-white"
                                onClick={() => handleOpenDialog(item)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-400 hover:text-red-400"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
