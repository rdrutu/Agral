"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  Tractor, 
  Mail,
  Loader2,
  AlertCircle,
  Calculator,
  Banknote,
  CheckCircle2
} from "lucide-react";
import React from "react";
import { addEmployee, removeEmployee, editEmployeeSalary } from "@/lib/actions/users";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface EmployeesClientProps {
  initialEmployees: any[];
  maxUsers: number;
}

export default function EmployeesClient({ initialEmployees, maxUsers }: EmployeesClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("worker");
  const [addType, setAddType] = useState<"member" | "registry" | null>(null);

  // Payroll state
  const [activePayrollUserId, setActivePayrollUserId] = useState<string | null>(null);
  const [salaryInput, setSalaryInput] = useState<number | "">("");
  const [salaryMode, setSalaryMode] = useState<"gross" | "net">("gross");
  const [payType, setPayType] = useState("full-time");

  // Payroll state
  const platformUsers = initialEmployees.filter(u => u.canLogin !== false);
  const registryEmployees = initialEmployees.filter(u => u.canLogin === false);
  const currentCount = platformUsers.length;
  const isLimitReached = currentCount >= maxUsers;

  async function handleAdd() {
    if (!firstName || !lastName) {
      toast.error("Numele și prenumele sunt obligatorii.");
      return;
    }
    if (addType === 'member' && !email) {
      toast.error("Email-ul este obligatoriu pentru membrii cu acces în platformă.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addEmployee({
        email: email || undefined,
        firstName,
        lastName,
        role,
        canLogin: addType === 'member',
        monthlySalary: salaryInput ? currentTaxes.brut : undefined,
        employmentType: payType
      });
      setAddType(null);
      setEmail("");
      setFirstName("");
      setLastName("");
      setSalaryInput("");
      setPayType("full-time");
      toast.success("Membru adăugat cu succes!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(id: string, name: string) {
    if (confirm(`Sigur doriți să eliminați accesul lui ${name}?`)) {
      try {
        await removeEmployee(id);
        toast.success(`Accesul lui ${name} a fost eliminat.`);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  }

  // RO 2026 Salary Calc Math
  const calculateFromGross = (brut: number) => {
    // Standard 2026 simplifying: CAS 25%, CASS 10%, IV 10%
    const CAS = Math.round(brut * 0.25);
    const CASS = Math.round(brut * 0.10);
    const deduction = CAS + CASS;
    const taxableBase = Math.max(0, brut - deduction);
    const tax = Math.round(taxableBase * 0.10);
    const net = brut - deduction - tax;
    
    return { CAS, CASS, tax, net, brut };
  };

  const calculateFromNet = (net: number) => {
    // Reverse math for Net -> Gross: Net = Gross * (1 - 0.25 - 0.10 - (1 - 0.35) * 0.10)
    // Net = Gross * (0.65 - 0.065) = Gross * 0.585
    const brut = Math.round(net / 0.585);
    return calculateFromGross(brut);
  };

  const currentTaxes = salaryMode === 'gross' 
    ? calculateFromGross(Number(salaryInput) || 0)
    : calculateFromNet(Number(salaryInput) || 0);

  async function handleSaveSalary(userId: string) {
    if (!salaryInput) return;
    setIsSubmitting(true);
    try {
      await editEmployeeSalary(userId, {
        monthlySalary: currentTaxes.brut,
        employmentType: payType
      });
      setActivePayrollUserId(null);
      setSalaryInput("");
      toast.success("Condiții salariale actualizate!");
      router.refresh();
    } catch (err: any) {
      toast.error("Eroare la salvare: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Echipa & Angajați
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestionează persoanele care au acces la ferma ta și rolurile acestora.
          </p>
        </div>
        
        {!addType && (
          <div className="flex gap-2">
            <Button 
              onClick={() => setAddType("member")} 
              disabled={isLimitReached}
              className="agral-gradient text-white gap-2 shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              Acces Platformă
            </Button>
            <Button 
              onClick={() => setAddType("registry")} 
              variant="outline"
              className="gap-2 shadow-sm border-primary/20 text-primary border-2"
            >
              <Users className="w-4 h-4" />
              Doar Registru HR
            </Button>
          </div>
        )}
      </div>

      {/* Limit Alert */}
      {isLimitReached && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-sm">
              <strong>Limită atinsă!</strong> Abonamentul tău curent permite maxim <strong>{maxUsers} utilizeatori</strong>. 
              Elimină un membru existent sau contactează administratorul pentru upgrade.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Member Form */}
      {addType && (
        <Card className="animate-in slide-in-from-top-4 duration-300 border-primary/20 shadow-xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-lg">
              {addType === 'member' ? "Recrutare Membru Acces" : "Înregistrare Angajat Registru"}
            </CardTitle>
            <CardDescription>
              {addType === 'member' 
                ? "Acest utilizator va primi acces în platformă (consumă licență)." 
                : "Acest angajat este adăugat doar pentru gestiune și salarii (fără login, nelimitat)."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Prenume</Label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Andrei" className="h-11 shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Nume Familie</Label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Popescu" className="h-11 shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Email {addType === 'member' ? "(Necesar)" : "(Opțional)"}</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="andrei@email.com" className="h-11 shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Rol în fermă</Label>
                <select 
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm font-semibold"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="worker">Lucrător</option>
                  <option value="agronomist">Agronom</option>
                  <option value="owner">Co-Proprietar</option>
                </select>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Configurare Salariu Campanie</h4>
                    <p className="text-[10px] text-muted-foreground italic">Aceste date vor apărea în simularea de costuri lunare.</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Mod Calcul</Label>
                      <div className="flex bg-white/50 p-1 rounded-lg h-10 border">
                        <button 
                          type="button"
                          className={cn("flex-1 text-[10px] font-black rounded-md transition-all", salaryMode === 'gross' ? "bg-primary text-white shadow-md" : "text-muted-foreground")}
                          onClick={() => setSalaryMode("gross")}
                        >
                          BRUT
                        </button>
                        <button 
                          type="button"
                          className={cn("flex-1 text-[10px] font-black rounded-md transition-all", salaryMode === 'net' ? "bg-primary text-white shadow-md" : "text-muted-foreground")}
                          onClick={() => setSalaryMode("net")}
                        >
                          NET
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Sumă ({salaryMode === 'gross' ? 'Brută' : 'Netă'})</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          className="h-10 shadow-sm font-black pl-8" 
                          value={salaryInput} 
                          onChange={e => setSalaryInput(parseFloat(e.target.value) || "")} 
                          placeholder="0" 
                        />
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-xs font-bold">lei</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Regim Angajare</Label>
                    <select 
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                      value={payType}
                      onChange={e => setPayType(e.target.value)}
                    >
                      <option value="full-time">Normă Întreagă (8h)</option>
                      <option value="part-time">Part-Time (4h)</option>
                      <option value="seasonal">Zilier / Sezonier</option>
                    </select>
                  </div>
                </div>
              </div>

              {salaryInput ? (
                <div className="bg-primary/5 rounded-2xl p-6 border-2 border-primary/10 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Rezumat Cost Angajat</span>
                    <Badge className="bg-green-100 text-green-800 border-none text-[9px] px-2 italic font-bold">Simulare 2026</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Cost Total Fermă (Brut):</span>
                      <span className="font-black text-foreground">{currentTaxes.brut.toLocaleString()} RON</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-dashed pt-3">
                      <span className="text-muted-foreground font-medium">Net primit de angajat:</span>
                      <span className="font-black text-green-600 text-lg">{currentTaxes.net.toLocaleString()} RON</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground italic">
                      <span>Impozite & Contribuții:</span>
                      <span>{(currentTaxes.brut - currentTaxes.net).toLocaleString()} RON</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-muted/50 flex flex-center items-center justify-center p-8 text-center bg-muted/5">
                  <div className="space-y-2">
                    <Calculator className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground font-medium italic max-w-[200px]">Introdu o sumă pentru a vedea costurile totale generate pentru fermă.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <Button variant="ghost" onClick={() => setAddType(null)}>Anulează</Button>
              <Button className="agral-gradient text-white px-8" onClick={handleAdd} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : addType === 'member' ? "Creează Cont Acces" : "Adaugă în Registru"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b bg-primary/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge className="bg-primary text-white border-none">1</Badge>
              Membri cu Acces Platformă
              <Badge variant="secondary" className="font-mono bg-white/50">{platformUsers.length}/{maxUsers}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-widest font-bold">
                <tr>
                  <th className="px-4 md:px-6 py-4">Utilizator</th>
                  <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Rol / Acces</th>
                  <th className="px-4 md:px-6 py-4 hidden lg:table-cell">Email Login</th>
                  <th className="px-4 md:px-6 py-4 hidden xl:table-cell">Creat la</th>
                  <th className="px-4 md:px-6 py-4 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {platformUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className="hover:bg-muted/10 transition-colors group">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-[10px] md:text-xs uppercase border border-primary/10 shrink-0">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div className="font-bold text-foreground text-xs md:text-sm truncate">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            "uppercase text-[9px] md:text-[10px] font-black",
                            user.role === 'owner' ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                            "bg-blue-100 text-blue-700 hover:bg-blue-100"
                          )}>
                            {user.role === 'owner' ? 'Proprietar' : 'Membru'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2 font-medium text-muted-foreground italic text-xs">
                          <Mail className="w-3.5 h-3.5" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-xs text-muted-foreground hidden xl:table-cell">
                        {new Date(user.createdAt).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        {user.role !== 'owner' && (
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => {
                                 setActivePayrollUserId(activePayrollUserId === user.id ? null : user.id);
                                 if (user.monthlySalary) {
                                   setSalaryInput(Number(user.monthlySalary));
                                   setSalaryMode("gross");
                                   setPayType(user.employmentType || "full-time");
                                 }
                              }}
                            >
                              <Calculator className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemove(user.id, `${user.firstName} ${user.lastName}`)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {activePayrollUserId === user.id && (
                      <PayrollRow 
                        user={user} 
                        isSubmitting={isSubmitting} 
                        handleSaveSalary={handleSaveSalary} 
                        salaryInput={salaryInput} 
                        setSalaryInput={setSalaryInput} 
                        salaryMode={salaryMode}
                        setSalaryMode={setSalaryMode}
                        payType={payType} 
                        setPayType={setPayType} 
                        currentTaxes={currentTaxes} 
                        setActivePayrollUserId={setActivePayrollUserId} 
                      />
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b bg-amber-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge className="bg-amber-500 text-white border-none">2</Badge>
              Registru Angajați Gestiune
              <Badge variant="secondary" className="font-mono bg-white/50">{registryEmployees.length} persoane</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-widest font-bold">
                <tr>
                  <th className="px-4 md:px-6 py-4">Angajat</th>
                  <th className="px-4 md:px-6 py-4">Salariu Brut</th>
                  <th className="px-4 md:px-6 py-4 hidden md:table-cell">Data Adăugării</th>
                  <th className="px-4 md:px-6 py-4 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {registryEmployees.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className="hover:bg-muted/10 transition-colors group">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px] md:text-xs uppercase border border-amber-200 shrink-0">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-xs md:text-sm truncate">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-[9px] md:text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Shield className="w-3 h-3" /> <span className="hidden sm:inline">Fără Acces Logare</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        {user.monthlySalary ? (
                          <div className="font-black text-amber-600 text-xs md:text-sm">
                            {Number(user.monthlySalary).toLocaleString()} <span className="text-[10px] font-bold">RON</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Nestabilit</span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-xs text-muted-foreground hidden md:table-cell">
                        {new Date(user.createdAt).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => {
                               setActivePayrollUserId(activePayrollUserId === user.id ? null : user.id);
                               if (user.monthlySalary) {
                                 setSalaryInput(Number(user.monthlySalary));
                                 setSalaryMode("gross");
                                 setPayType(user.employmentType || "full-time");
                               }
                            }}
                          >
                            <Calculator className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemove(user.id, `${user.firstName} ${user.lastName}`)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {activePayrollUserId === user.id && (
                      <PayrollRow 
                        user={user} 
                        isSubmitting={isSubmitting} 
                        handleSaveSalary={handleSaveSalary} 
                        salaryInput={salaryInput} 
                        setSalaryInput={setSalaryInput} 
                        salaryMode={salaryMode}
                        setSalaryMode={setSalaryMode}
                        payType={payType} 
                        setPayType={setPayType} 
                        currentTaxes={currentTaxes} 
                        setActivePayrollUserId={setActivePayrollUserId} 
                      />
                    )}
                  </React.Fragment>
                ))}
                {registryEmployees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground italic">
                      Nu există angajați adăugați doar pentru gestiune.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-center text-xs text-muted-foreground pt-4">
        Fiecare membru cu acces consumă o licență din abonament. Angajații din Registru sunt nelimitați.
      </p>
    </div>
  );
}

function PayrollRow({ user, isSubmitting, handleSaveSalary, salaryInput, setSalaryInput, salaryMode, setSalaryMode, payType, setPayType, currentTaxes, setActivePayrollUserId }: any) {
  return (
    <tr className="bg-primary/5 shadow-inner">
      <td colSpan={5} className="px-6 py-8 border-b border-primary/20 animate-in fade-in slide-in-from-top-2">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Calculator Form */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-black flex items-center gap-2 text-primary uppercase tracking-tight text-sm">
                <Calculator className="w-5 h-5" />
                Calculator Salarii 2026 (RO)
              </h4>
              <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">
                {user.firstName} {user.lastName}
              </Badge>
            </div>

            <div className="space-y-4 bg-white/50 p-4 rounded-xl border border-primary/10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Regim de lucru</Label>
                  <select 
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                    value={payType}
                    onChange={e => setPayType(e.target.value)}
                  >
                    <option value="full-time">Normă Întreagă (8h)</option>
                    <option value="part-time">Part-Time (4h/2h)</option>
                    <option value="seasonal">Zilier / Sezonier</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Sursă Calcul</Label>
                  <div className="flex bg-muted/30 p-1 rounded-lg h-10">
                    <button 
                      className={cn("flex-1 text-[10px] font-black rounded-md transition-all", salaryMode === 'gross' ? "bg-white text-primary shadow-sm" : "text-muted-foreground")}
                      onClick={() => setSalaryMode("gross")}
                    >
                      BRUT
                    </button>
                    <button 
                      className={cn("flex-1 text-[10px] font-black rounded-md transition-all", salaryMode === 'net' ? "bg-white text-primary shadow-sm" : "text-muted-foreground")}
                      onClick={() => setSalaryMode("net")}
                    >
                      NET
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">
                  Suma {salaryMode === 'gross' ? 'Brută' : 'Netă'} (RON)
                </Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    className="h-12 shadow-sm font-black text-xl pl-10 border-primary/20 focus:border-primary transition-all" 
                    value={salaryInput} 
                    onChange={e => setSalaryInput(parseFloat(e.target.value) || "")} 
                    placeholder="0" 
                  />
                  <Banknote className="w-5 h-5 absolute left-3 top-3.5 text-primary opacity-50" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setActivePayrollUserId(null)} className="font-bold flex-1 h-10">
                Anulează
              </Button>
              <Button 
                className="agral-gradient text-white shadow-xl gap-2 font-black px-6 flex-1 h-10 uppercase text-xs"
                onClick={() => handleSaveSalary(user.id)}
                disabled={isSubmitting || !salaryInput}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4" />}
                Confirmă Salariu
              </Button>
            </div>
          </div>

          {/* Live Preview Fluturaș */}
          {salaryInput && (
            <div className="flex-1 max-w-sm border-2 border-primary/20 rounded-2xl bg-white shadow-2xl overflow-hidden text-sm flex flex-col transform hover:scale-[1.02] transition-transform duration-300">
              <div className="bg-primary/5 px-6 py-4 font-black border-b text-[11px] uppercase tracking-widest text-primary flex items-center justify-between">
                <span>Simulare Fluturaș Salariu</span>
                <span className="bg-primary/20 px-2 py-0.5 rounded italic">estimat 2026</span>
              </div>
              <div className="p-6 space-y-4 flex-1">
                <div className="flex justify-between items-center bg-primary/5 p-3 rounded-xl border border-primary/10">
                  <span className="font-bold text-muted-foreground">SALARIU BRUT</span>
                  <span className="font-black text-lg text-foreground">{currentTaxes.brut.toLocaleString()} lei</span>
                </div>
                
                <div className="space-y-2 border-l-2 border-dashed border-muted/50 pl-4 py-1">
                  <div className="flex justify-between items-center group">
                    <span className="text-xs text-muted-foreground">CAS (Pensii 25%)</span>
                    <span className="font-bold text-xs">-{currentTaxes.CAS.toLocaleString()} lei</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-xs text-muted-foreground">CASS (Sănătate 10%)</span>
                    <span className="font-bold text-xs">-{currentTaxes.CASS.toLocaleString()} lei</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-xs text-muted-foreground">Impozit Venit (10% din baza)</span>
                    <span className="font-bold text-xs">-{currentTaxes.tax.toLocaleString()} lei</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-green-50 p-4 rounded-2xl border-2 border-green-200 shadow-inner mt-4">
                  <div className="space-y-0.5">
                    <span className="font-black text-green-700 uppercase text-[10px] tracking-widest">Rest de plată (NET)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-black text-3xl text-green-700 leading-none">{currentTaxes.net.toLocaleString()}</span>
                      <span className="font-black text-[10px] text-green-600">LEI</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-3 bg-muted/10 text-[9px] text-muted-foreground border-t italic text-center">
                * Calculul include contribuțiile standard. Pot exista scutiri specifice domeniului agricol.
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

