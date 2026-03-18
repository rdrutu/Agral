"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Search,
  PieChart,
  History,
  Info,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatDate } from "@/lib/utils";
import { 
  getFinancialTransactions, 
  getFinancialSummary, 
  addFinancialTransaction,
} from "@/lib/actions/finance";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

export default function FinanceClient({ 
  initialTransactions, 
  initialSummary,
  hideHeader = false
}: { 
  initialTransactions: any[],
  initialSummary: any,
  hideHeader?: boolean
}) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [summary, setSummary] = useState(initialSummary);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    category: "other",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0]
  });

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return toast.error("Completează toate câmpurile obligatorii");

    setIsSubmitting(true);
    try {
      await addFinancialTransaction({
        type: formData.type,
        category: formData.category,
        amount: Number(formData.amount),
        description: formData.description,
        date: new Date(formData.date)
      });
      toast.success("Tranzacție adăugată cu succes");
      setIsModalOpen(false);
      setFormData({
        type: "expense",
        category: "other",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0]
      });
      router.refresh();
      // Update local state temporarily for better UX
      const newTransactions = await getFinancialTransactions();
      const newSummary = await getFinancialSummary();
      setTransactions(newTransactions);
      setSummary(newSummary);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Gestiune Financiară</h1>
            <p className="text-muted-foreground font-medium">Monitorizează veniturile, cheltuielile și profitabilitatea fermei.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 font-bold shadow-sm">
              <Download className="w-4 h-4" /> Exportă Raport
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="agral-gradient text-white gap-2 font-bold shadow-md">
              <DollarSign className="w-4 h-4" /> Adaugă Tranzacție
            </Button>
          </div>
        </div>
      )}

      {hideHeader && (
        <div className="flex justify-end gap-2">
           <Button variant="outline" className="gap-2 font-bold shadow-sm">
            <Download className="w-4 h-4" /> Exportă Raport
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="agral-gradient text-white gap-2 font-bold shadow-md">
            <DollarSign className="w-4 h-4" /> Adaugă Tranzacție
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl bg-gradient-to-br from-green-50/50 to-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={80} className="text-green-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-green-700 font-bold uppercase tracking-wider text-[10px]">Total Venituri</CardDescription>
            <CardTitle className="text-3xl font-black text-green-600">{summary?.totalIncome?.toLocaleString() || 0} RON</CardTitle>
          </CardHeader>
            <CardContent>
            <div className="text-xs text-green-700 font-medium flex items-center gap-1">
              Balanță pozitivă venită din vânzări
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-gradient-to-br from-red-50/50 to-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingDown size={80} className="text-red-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-red-700 font-bold uppercase tracking-wider text-[10px]">Total Cheltuieli</CardDescription>
            <CardTitle className="text-3xl font-black text-red-600">{summary?.totalExpense?.toLocaleString() || 0} RON</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-red-700 font-medium flex items-center gap-1">
              Resurse, motorină și salarizare
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-none shadow-xl overflow-hidden relative group",
          summary?.profit >= 0 ? "bg-gradient-to-br from-primary/10 to-white" : "bg-gradient-to-br from-amber-50 to-white"
        )}>
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign size={80} className="text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-primary font-bold uppercase tracking-wider text-[10px]">Profit Estimativ</CardDescription>
            <CardTitle className={cn("text-3xl font-black", summary?.profit >= 0 ? "text-primary" : "text-amber-600")}>
              {summary?.profit?.toLocaleString() || 0} RON
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground font-medium">Balanță financiară în timp real</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transactions Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border w-full sm:w-auto">
              <button 
                className={cn("px-4 py-2 text-xs font-black rounded-lg transition-all", filterType === 'all' ? "bg-primary text-white" : "text-muted-foreground")}
                onClick={() => setFilterType('all')}
              >
                TOATE
              </button>
              <button 
                className={cn("px-4 py-2 text-xs font-black rounded-lg transition-all", filterType === 'income' ? "bg-green-600 text-white" : "text-muted-foreground")}
                onClick={() => setFilterType('income')}
              >
                VENITURI
              </button>
              <button 
                className={cn("px-4 py-2 text-xs font-black rounded-lg transition-all", filterType === 'expense' ? "bg-red-600 text-white" : "text-muted-foreground")}
                onClick={() => setFilterType('expense')}
              >
                CHELTUIELI
              </button>
            </div>
             <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Caută în tranzacții..." 
                className="pl-9 h-11 border-none bg-white shadow-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Card className="border-none shadow-lg overflow-hidden bg-white/70 backdrop-blur-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-muted/20 text-[10px] md:text-xs">
                      <th className="text-left px-3 md:p-4 font-bold text-muted-foreground uppercase tracking-wider">Data</th>
                      <th className="text-left px-3 md:p-4 font-bold text-muted-foreground uppercase tracking-wider">Descriere / Categorie</th>
                      <th className="text-right px-3 md:p-4 font-bold text-muted-foreground uppercase tracking-wider">Sumă</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-3 md:p-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={cn(
                            "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                            t.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {t.type === "income" ? <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" /> : <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5" />}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-xs md:text-sm">
                              {formatDate(t.date)}
                            </div>
                            <div className="text-[9px] md:text-[10px] text-muted-foreground font-black uppercase hidden sm:block">
                              {new Date(t.date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:p-4">
                        <p className="font-bold text-foreground text-xs md:text-sm line-clamp-1">{t.description}</p>
                        <Badge variant="outline" className="text-[8px] md:text-[9px] uppercase font-black tracking-tighter mt-1 bg-white px-1 md:px-1.5 py-0 h-3.5 md:h-4 border-muted/50">
                          {t.category}
                        </Badge>
                      </td>
                      <td className="px-3 md:p-4 text-right">
                        <div className={cn(
                          "text-sm md:text-base font-black",
                          t.type === "income" ? "text-green-600" : "text-red-600"
                        )}>
                          {t.type === "income" ? "+" : "-"}{Number(t.amount).toLocaleString()} <span className="text-[9px] md:text-[10px] font-bold">RON</span>
                        </div>
                      </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <History className="w-10 h-10 opacity-20" />
                            <p className="font-bold">Nicio tranzacție găsită.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Reports */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-primary text-white overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <PieChart size={120} />
            </div>
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <PieChart className="w-5 h-5" /> Distribuție Costuri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-80">
                  <span>Lucrări</span>
                  <span>{(summary?.categories?.["Lucrări"] || 0).toLocaleString()} RON</span>
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-1000" 
                    style={{ width: `${summary?.totalExpense > 0 ? ((summary?.categories?.["Lucrări"] || 0) / summary?.totalExpense * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-80">
                  <span>Salarii</span>
                  <span>{(summary?.categories?.["Salarii"] || 0).toLocaleString()} RON</span>
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-1000" 
                    style={{ width: `${summary?.totalExpense > 0 ? ((summary?.categories?.["Salarii"] || 0) / summary?.totalExpense * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-80">
                  <span>Mentenanță</span>
                  <span>{(summary?.categories?.["Mentenanță"] || 0).toLocaleString()} RON</span>
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-1000" 
                    style={{ width: `${summary?.totalExpense > 0 ? ((summary?.categories?.["Mentenanță"] || 0) / summary?.totalExpense * 100) : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Stats */}
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Tendințe Lunare
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {Object.entries(summary?.statsByMonth || {}).map(([month, stats]: [string, any]) => (
                <div key={month} className="space-y-1.5 border-b border-muted/20 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                    <span>{month}</span>
                    <span className={cn(stats.income >= stats.expense ? "text-green-600" : "text-red-600")}>
                      {(stats.income - stats.expense).toLocaleString()} RON
                    </span>
                  </div>
                  <div className="flex h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 h-full transition-all" 
                      style={{ width: `${(stats.income / (stats.income + stats.expense || 1)) * 100}%` }}
                    />
                    <div 
                      className="bg-red-500 h-full transition-all" 
                      style={{ width: `${(stats.expense / (stats.income + stats.expense || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> Note Gestiune
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Toate datele sunt agregate automat din activitatea fermei (recoltări, vânzări, stocuri și HR).
                <br /><br />
                Vânzările scad automat stocul din magazie, iar costurile cu semințele și utilajele sunt înregistrate la începutul fiecărei lucrări.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* Transaction Modal */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-black text-xl flex items-center gap-2">
            <DollarSign className="text-primary" />
            Adaugă Tranzacție Manuală
          </DialogTitle>
          <DialogDescription className="font-medium">
            Înregistrează o intrare sau o ieșire care nu a fost generată automat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddTransaction} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              className={cn(
                "py-2 text-xs font-black rounded-lg transition-all",
                formData.type === 'income' ? "bg-white text-green-600 shadow-sm" : "text-muted-foreground"
              )}
              onClick={() => setFormData({...formData, type: 'income'})}
            >
              VENIT
            </button>
            <button
              type="button"
              className={cn(
                "py-2 text-xs font-black rounded-lg transition-all",
                formData.type === 'expense' ? "bg-white text-red-600 shadow-sm" : "text-muted-foreground"
              )}
              onClick={() => setFormData({...formData, type: 'expense'})}
            >
              CHELTUIALĂ
            </button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase opacity-70">Descriere Tranzacție</Label>
            <Input 
              placeholder="Ex: Reparație tractor, Vânzare cereale" 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase opacity-70">Sumă (RON)</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase opacity-70">Categorie</Label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="other">Altele</option>
                <option value="sale">Vânzare</option>
                <option value="repair">Reparații</option>
                <option value="fuel">Combustibil</option>
                <option value="utilities">Utilități</option>
                <option value="lease">Arendă</option>
                <option value="seed">Semințe</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase opacity-70">Data Tranzacției</Label>
            <Input 
              type="date" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="submit" 
              className={cn(
                "w-full font-black uppercase tracking-widest text-white shadow-xl h-12",
                formData.type === 'income' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              )}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Salvează Tranzacția
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
