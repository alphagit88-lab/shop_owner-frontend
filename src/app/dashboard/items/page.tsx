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
import { Search, Plus, Edit, Trash2, DollarSign, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Gap 1: Pricing modal state
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
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  // Gap 1: Open pricing modal with customer selection
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
          <h2 className="text-3xl font-bold tracking-tight text-white">Items Catalog</h2>
          <p className="text-zinc-500">Manage your jewelry items, stock, and pricing.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button onClick={() => handleOpenDialog()} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
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
                  className="bg-white/5 border-zinc-800 focus:ring-amber-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemDescription">Description *</Label>
                <Input
                  id="itemDescription"
                  required
                  value={formData.itemDescription}
                  onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                  placeholder="e.g. 1.0ct Round Brilliant Diamond"
                  className="bg-white/5 border-zinc-800 focus:ring-amber-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitPriceUsd">Price (USD) *</Label>
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
                    className="bg-white/5 border-zinc-800 focus:ring-amber-500/50"
                  />
                </div>
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
                    className="bg-white/5 border-zinc-800 focus:ring-amber-500/50"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="hover:bg-white/10 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                  {editingItem ? "Save Changes" : "Create Item"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gap 1: Pricing / Customer Selection Modal */}
      <Dialog open={isPricingModalOpen} onOpenChange={setIsPricingModalOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-white sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Select Customer for Pricing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-9 bg-white/5 border-zinc-800 text-white"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {filteredCustomers.length === 0 ? (
                <p className="text-center text-zinc-500 py-6 text-sm">No customers found.</p>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                      selectedCustomer?.id === customer.id
                        ? "border-amber-500/50 bg-amber-500/10"
                        : "border-zinc-800 bg-black/20 hover:bg-white/5 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-zinc-500" />
                          <span className="font-medium text-white">{customer.customerName}</span>
                        </div>
                        <div className="mt-1.5 space-y-0.5 pl-6">
                          {customer.email && (
                            <div className="flex items-center text-xs text-zinc-400">
                              <Mail className="w-3 h-3 mr-1.5 text-zinc-600" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phoneNumber && (
                            <div className="flex items-center text-xs text-zinc-400">
                              <Phone className="w-3 h-3 mr-1.5 text-zinc-600" />
                              {customer.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">
                        ID: {customer.id}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
              <Button variant="ghost" onClick={() => setIsPricingModalOpen(false)} className="hover:bg-white/10 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={handleProceedToQuotation}
                disabled={!selectedCustomer}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold disabled:opacity-40"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Proceed to Quotation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search by code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-black/40 border-zinc-800 text-white focus:ring-amber-500/50"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800/50 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Code</TableHead>
                  <TableHead className="text-zinc-400">Description</TableHead>
                  <TableHead className="text-zinc-400 text-right">Price (USD)</TableHead>
                  <TableHead className="text-zinc-400 text-right">Price (LKR)</TableHead>
                  <TableHead className="text-zinc-400 text-center">Status</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="border-zinc-800/50">
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500">Loading items...</TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow className="border-zinc-800/50">
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500">No items found</TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="border-zinc-800/50 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium text-white">{item.itemCode || "-"}</TableCell>
                      <TableCell className="text-zinc-300 max-w-[300px] truncate">{item.itemDescription}</TableCell>
                      <TableCell className="text-right text-emerald-400 font-medium">${Number(item.unitPriceUsd).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-amber-400/90 font-medium">Rs.{Number(item.unitPriceLkr).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={item.isAvailable ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" : "border-red-500/30 text-red-500 bg-red-500/10"}>
                          {item.isAvailable ? "In Stock" : "Sold"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10"
                            onClick={() => handleOpenPricingModal(item.id)}
                            title="Create Quotation"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
