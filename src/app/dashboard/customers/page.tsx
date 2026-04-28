"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Mail, Phone, Calendar } from "lucide-react";
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
    setFormData({ customerName: "", phoneNumber: "", email: "" });
    setIsDialogOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/customers", formData);
      toast.success("Customer added successfully");
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
          <p className="text-zinc-500">Manage your client database and contact details.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button onClick={handleOpenDialog} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Add Customer
            </Button>
          } />
          <DialogContent className="bg-zinc-950 border border-zinc-800 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
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
                  className="bg-white/5 border-zinc-800 focus:ring-amber-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="e.g. +1 234 567 8900"
                  className="bg-white/5 border-zinc-800 focus:ring-amber-500/50"
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
                  className="bg-white/5 border-zinc-800 focus:ring-amber-500/50"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="hover:bg-white/10 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                  Create Customer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white/5 border-zinc-800/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search by name, email or phone..."
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
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400">Contact Information</TableHead>
                  <TableHead className="text-zinc-400">Added On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="border-zinc-800/50">
                    <TableCell colSpan={3} className="text-center py-8 text-zinc-500">Loading customers...</TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow className="border-zinc-800/50">
                    <TableCell colSpan={3} className="text-center py-8 text-zinc-500">No customers found</TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id} className="border-zinc-800/50 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium text-white text-base">{customer.customerName}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center text-zinc-400 text-sm">
                              <Mail className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phoneNumber && (
                            <div className="flex items-center text-zinc-400 text-sm">
                              <Phone className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                              {customer.phoneNumber}
                            </div>
                          )}
                          {!customer.email && !customer.phoneNumber && (
                            <span className="text-zinc-600 italic text-sm">No contact info</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        <div className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                          {new Date(customer.createdAt).toLocaleDateString()}
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
