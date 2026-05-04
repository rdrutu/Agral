"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  History,
  ArrowDownCircle,
  ArrowUpCircle,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  ChevronRight,
  Plus
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { deleteInventoryTransaction, updateInventoryTransaction, recordAdjustment } from "@/lib/actions/inventory";
import toast from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import { CardContent, CardHeader, CardTitle, Card } from "@/components/ui/card";

interface Transaction {
  id: string;
  lotId: string;
  type: string;
  quantity: number;
  date: string;
  description: string;
  lotPrice: number;
  lotTva: number;
  supplier: string;
  doc: string;
  runningBalance: number;
  source?: string;
}

interface ProductFileModalProps {
  item: any;
  history: Transaction[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ProductFileModal({
  item,
  history,
  isOpen,
  onClose,
  onRefresh
}: ProductFileModalProps) {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStock, setUpdateStock] = useState(true);

  const [editData, setEditData] = useState({
    quantity: 0,
    description: "",
    date: "",
    unitPrice: 0,
    tvaRate: 0.19
  });

  const [addData, setAddData] = useState({
    type: "adjustment",
    quantity: 0,
    description: "",
    date: new Date().toISOString().split('T')[0]
  });

  const handleEditInit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditData({
      quantity: tx.quantity,
      description: tx.description || "",
      date: tx.date.split('T')[0],
      unitPrice: tx.lotPrice || 0,
      tvaRate: tx.lotTva || 0.19
    });
  };

  const handleUpdate = async () => {
    if (!editingTx) return;
    setIsUpdating(true);
    try {
      await updateInventoryTransaction(editingTx.id, {
        quantity: editData.quantity,
        description: editData.description,
        date: new Date(editData.date),
        unitPrice: editData.unitPrice,
        tvaRate: editData.tvaRate
      }, updateStock);
      toast.success("Tranzacție actualizată!");
      setEditingTx(null);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Eroare la actualizare");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (txId: string) => {
    if (!confirm("Sigur dorești să ștergi această tranzacție?")) return;
    setIsUpdating(true);
    try {
      await deleteInventoryTransaction(txId, updateStock);
      toast.success("Tranzacție ștearsă!");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Eroare la ștergere");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTransaction = async () => {
    if (addData.quantity === 0) return;
    setIsUpdating(true);
    try {
      await recordAdjustment(item.id, {
        type: addData.type,
        quantity: addData.quantity,
        description: addData.description,
        date: new Date(addData.date)
      });
      toast.success("Tranzacție înregistrată!");
      setShowAddForm(false);
      setAddData({
        type: "adjustment",
        quantity: 0,
        description: "",
        date: new Date().toISOString().split('T')[0]
      });
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Eroare la adăugare");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl bg-slate-50">
        <DialogHeader className="p-8 bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] mb-2">
                <History className="w-3 h-3" /> Fișă Detaliată Produs
              </div>
              <DialogTitle className="text-4xl font-black tracking-tight text-slate-900">
                {item?.name}
              </DialogTitle>
              <DialogDescription className="font-bold text-slate-500 flex items-center gap-4 text-sm mt-2">
                <span className="flex items-center gap-1.5"><Badge variant="outline" className="bg-slate-100 uppercase text-[9px]">{item?.category}</Badge></span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="flex items-center gap-1.5">Stoc: <strong className="text-slate-900">{Number(item?.stockQuantity).toLocaleString()} {item?.unit}</strong></span>
              </DialogDescription>
            </div>
            <div className="text-right bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Valoare Gestiune</div>
              <div className="text-3xl font-black text-emerald-700">
                {(Number(item?.stockQuantity) * Number(item?.pricePerUnit)).toLocaleString('ro-RO', { style: 'currency', currency: 'RON' })}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* Active Lots Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2 lg:col-span-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Loturi Active în Stoc
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {item.lots?.filter((l: any) => Number(l.quantity) > 0).map((lot: any) => (
                  <div key={lot.id} className="bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3">
                      <Badge variant="outline" className={cn("text-[9px] font-black uppercase", lot.expiryDate && new Date(lot.expiryDate) < new Date() ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>
                        {lot.expiryDate ? (new Date(lot.expiryDate) < new Date() ? "Expirat" : "Valid") : "Fără Exp."}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lot ID / Doc</span>
                        <span className="text-sm font-black text-slate-900 truncate pr-10">{lot.documentNumber || lot.id.slice(0, 8)}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cantitate</span>
                          <span className="text-xl font-black text-primary">{Number(lot.quantity).toLocaleString()} <small className="text-[10px] text-slate-400 uppercase font-bold">{item.unit}</small></span>
                        </div>
                      </div>
                      {lot.expiryDate && (
                        <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-500">Exp: {formatDate(lot.expiryDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!item.lots || item.lots.filter((l: any) => Number(l.quantity) > 0).length === 0) && (
                  <div className="col-span-full py-8 text-center bg-white border border-dashed border-slate-200 rounded-[32px]">
                    <p className="text-slate-400 font-bold text-sm">Nu există loturi active în stoc.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Actualizare Automată Stoc</p>
                <p className="text-xs text-slate-500 font-bold max-w-md">Dacă este activat, modificările aduse tranzacțiilor vor influența automat soldul curent din magazie.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border">
               <Button 
                variant="outline" 
                className="h-8 rounded-xl font-black uppercase tracking-widest text-[9px] border-slate-200 gap-2 bg-white shadow-sm mr-2"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className={cn("w-3 h-3 transition-transform", showAddForm && "rotate-45")} />
                {showAddForm ? "Anulează" : "Adaugă Tranzacție"}
              </Button>
               <Label className={cn("text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all", !updateStock ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}>Dezactivat</Label>
               <Switch checked={updateStock} onCheckedChange={setUpdateStock} className="data-[state=checked]:bg-emerald-500" />
               <Label className={cn("text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all", updateStock ? "bg-white shadow-sm text-emerald-600" : "text-slate-400")}>Activat</Label>
            </div>
          </div>

          {/* Add Transaction Form */}
          {showAddForm && (
            <Card className="rounded-[32px] border-2 border-primary/10 shadow-lg bg-white overflow-hidden animate-in slide-in-from-top-4 duration-300">
               <CardHeader className="p-6 bg-slate-50/50 border-b">
                  <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-primary">
                    <Plus className="w-4 h-4" /> Înregistrare Tranzacție Manuală
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tip</Label>
                    <select 
                      className="h-11 w-full rounded-xl border bg-white px-3 text-xs font-black"
                      value={addData.type}
                      onChange={e => setAddData(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="adjustment">Ajustare Stoc</option>
                      <option value="consumption">Consum Manual</option>
                      <option value="intake">Intrare Manuală</option>
                      <option value="return">Retur Produs (Client/Furnizor)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cantitate (+/-)</Label>
                    <Input 
                      type="number" 
                      className="h-11 font-black" 
                      value={addData.quantity}
                      onChange={e => setAddData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Descriere</Label>
                    <Input 
                      placeholder="Explicație tranzacție..." 
                      className="h-11 font-bold text-xs"
                      value={addData.description}
                      onChange={e => setAddData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <Button className="h-11 rounded-xl agral-gradient text-white font-black uppercase tracking-widest text-[9px]" onClick={handleAddTransaction} disabled={isUpdating}>
                    Salvează Tranzacția
                  </Button>
               </CardContent>
            </Card>
          )}

          {/* History Table */}
          <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b">
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Dată / Document</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Operațiune & Descriere</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Mutație</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Preț Unitar</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Sold Jurnal</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((tx) => (
                  <tr key={tx.id} className={cn("group transition-colors", editingTx?.id === tx.id ? "bg-primary/5" : "hover:bg-slate-50/50")}>
                    <td className="p-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-black text-slate-900">{formatDate(tx.date)}</span>
                        <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg w-fit">
                          <FileText className="w-3 h-3" /> {tx.doc || "Fără document"}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          {tx.type === 'intake' ? (
                            <div className="bg-emerald-500 text-white p-1 rounded-md"><ArrowUpCircle className="w-3 h-3" /></div>
                          ) : tx.type === 'sale' ? (
                            <div className="bg-blue-500 text-white p-1 rounded-md"><DollarSign className="w-3 h-3" /></div>
                          ) : tx.type === 'return' ? (
                            <div className="bg-purple-500 text-white p-1 rounded-md"><ArrowUpCircle className="w-3 h-3" /></div>
                          ) : (
                            <div className="bg-amber-500 text-white p-1 rounded-md"><ArrowDownCircle className="w-3 h-3" /></div>
                          )}
                          <span className="text-sm font-black text-slate-700 truncate max-w-[250px]">{tx.description}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           {tx.supplier && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {tx.supplier}
                            </span>
                          )}
                          {tx.source === 'harvest' && (
                             <Badge className="bg-purple-50 text-purple-600 border-purple-100 text-[9px] font-black uppercase px-2 py-0">Producție Proprie</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className={cn("font-black text-md", tx.quantity > 0 ? "text-emerald-600" : "text-amber-600")}>
                        {tx.quantity > 0 ? "+" : ""}{Number(tx.quantity).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="font-black text-xs text-slate-900">
                        {tx.lotPrice?.toFixed(2)} <span className="text-[9px] font-normal text-slate-400">RON</span>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="font-black text-sm text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl inline-block border border-slate-200/50">
                        {Number(tx.runningBalance).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5" 
                          onClick={() => handleEditInit(tx)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-destructive hover:bg-destructive/5"
                          onClick={() => handleDelete(tx.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">Nicio tranzacție înregistrată pentru acest produs.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal (Inline/Nested) */}
        {editingTx && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border-none rounded-[32px] overflow-hidden">
              <CardHeader className="bg-white border-b p-6">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Edit2 className="w-5 h-5 text-primary" />
                  </div>
                  Editare Tranzacție
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6 bg-slate-50/30">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Cantitate ({item.unit})</Label>
                  <Input 
                    type="number" 
                    value={editData.quantity} 
                    onChange={e => setEditData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="h-14 font-black text-xl rounded-2xl border-slate-200 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Dată Operare</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="date" 
                        value={editData.date} 
                        onChange={e => setEditData(prev => ({ ...prev, date: e.target.value }))}
                        className="h-14 font-bold pl-12 rounded-2xl border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Preț Unitar</Label>
                    <Input 
                      type="number" 
                      value={editData.unitPrice} 
                      onChange={e => setEditData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      className="h-14 font-black rounded-2xl border-slate-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Descriere / Observații</Label>
                    <Input 
                      value={editData.description} 
                      onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      className="h-14 font-bold rounded-2xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Cota TVA</Label>
                    <select 
                      className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black"
                      value={editData.tvaRate}
                      onChange={(e) => setEditData(prev => ({ ...prev, tvaRate: parseFloat(e.target.value) }))}
                    >
                       <option value="0.09">9% (Cereale/Semințe)</option>
                       <option value="0.19">19% (Standard)</option>
                       <option value="0.05">5% (Lemne/Altele)</option>
                       <option value="0">0% (Scutit)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 font-black h-14 rounded-2xl border-slate-200 hover:bg-white" onClick={() => setEditingTx(null)}>Anulează</Button>
                  <Button className="flex-1 font-black h-14 rounded-2xl agral-gradient text-white shadow-lg shadow-primary/20" onClick={handleUpdate} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                    Salvează
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
