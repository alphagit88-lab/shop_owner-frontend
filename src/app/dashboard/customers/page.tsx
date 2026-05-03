"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Mail, Phone, Calendar, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: number;
  customerName: string;
  phoneNumber: string;
  email: string;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    email: "",
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers${search ? `?search=${search}` : ""}`);
      setCustomers(res.data);
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleOpenDialog = () => {
    setEditingCustomer(null);
    setFormData({ customerName: "", phoneNumber: "", email: "" });
    setIsDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      customerName: customer.customerName,
      phoneNumber: customer.phoneNumber || "",
      email: customer.email || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to delete customer");
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success("Customer updated successfully");
      } else {
        await api.post("/customers", formData);
        toast.success("Customer added successfully");
      }
      setIsDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to save customer");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Customers</h2>
          <p className="text-zinc-500 text-sm md:text-base">Manage your client database and contact details.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button onClick={handleOpenDialog} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Add Customer
            </Button>
          } />
          <DialogContent className="bg-zinc-950 border border-zinc-800 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveCustomer} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="bg-white/5 border-zinc-800 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="e.g. +1 234 567 8900"
                  className="bg-white/5 border-zinc-800 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                  className="bg-white/5 border-zinc-800 focus:ring-blue-500/50"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="hover:bg-white/10 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  {editingCustomer ? "Update Customer" : "Create Customer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-black/40 border-zinc-800 text-white focus:ring-blue-500/50"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle md:px-0 px-4">
              <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-900/50">
                    <TableRow className="border-zinc-800/50 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Name</TableHead>
                      <TableHead className="text-zinc-400">Contact</TableHead>
                      <TableHead className="hidden md:table-cell text-zinc-400">Added</TableHead>
                      <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow className="border-zinc-800/50">
                        <TableCell colSpan={4} className="text-center py-8 text-zinc-500">Loading...</TableCell>
                      </TableRow>
                    ) : customers.length === 0 ? (
                      <TableRow className="border-zinc-800/50">
                        <TableCell colSpan={4} className="text-center py-8 text-zinc-500">No customers found</TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => (
                        <TableRow key={customer.id} className="border-zinc-800/50 hover:bg-white/5 transition-colors">
                          <TableCell className="font-medium text-white">{customer.customerName}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {customer.email && (
                                <div className="flex items-center text-zinc-400 text-[10px] md:text-xs">
                                  <Mail className="w-3 h-3 mr-1.5 text-zinc-500 hidden sm:block" />
                                  <span className="truncate max-w-[100px] md:max-w-[200px]">{customer.email}</span>
                                </div>
                              )}
                              {customer.phoneNumber && (
                                <div className="flex items-center text-zinc-400 text-[10px] md:text-xs">
                                  <Phone className="w-3 h-3 mr-1.5 text-zinc-500 hidden sm:block" />
                                  {customer.phoneNumber}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-zinc-400 text-xs whitespace-nowrap">
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                                onClick={() => handleEditCustomer(customer)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400"
                                onClick={() => handleDeleteCustomer(customer.id)}
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
