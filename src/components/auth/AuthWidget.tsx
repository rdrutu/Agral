"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

export function AuthWidget() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email sau parolă incorectă. Încearcă din nou.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const farmName = formData.get("farmName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          farm_name: farmName,
          full_name: `${firstName} ${lastName}`,
        },
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        setError("Acest email este deja înregistrat. Încearcă să te loghezi.");
      } else {
        setError("A apărut o eroare. Încearcă din nou.");
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    // Redirecționăm după 2s dacă confirmarea email nu e necesară
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  };

  if (success) {
    return (
      <Card className="w-full shadow-2xl border-0 overflow-hidden bg-background/95 backdrop-blur-xl">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Cont creat cu succes!</h2>
          <p className="text-muted-foreground mb-6">Te redirecționăm la dashboard...</p>
          <div className="w-10 h-10 border-4 border-primary/40 border-t-primary rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-2xl border-border/50 overflow-hidden bg-background/95 backdrop-blur-xl h-[720px] flex flex-col">
      <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setError(null); }} className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-muted/60 p-1 shrink-0">
            <TabsTrigger value="login" className="rounded-md font-bold text-sm h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Conectare
            </TabsTrigger>
            <TabsTrigger value="register" className="rounded-md font-bold text-sm h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Cont Nou
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 relative">
            {/* Wrapper absolut care acoperă tot restul containerului ca să nu mute înălțimea */}
            <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-1 flex flex-col justify-center">
              <TabsContent value="login" className="space-y-6 mt-0 animate-in slide-in-from-left-2 duration-300 w-full sm:mx-auto max-w-sm flex flex-col justify-center h-full">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-extrabold">Bine ai revenit!</h2>
                  <p className="text-muted-foreground text-sm mt-1">Accesează portalul fermei tale</p>
                </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && activeTab === "login" && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="ion@ferma.ro"
                  required
                  className="h-12 bg-background/50 focus-visible:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="login-password">Parolă</Label>
                  <a href="#" className="text-xs text-primary hover:underline font-medium">Ai uitat parola?</a>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    name="password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="h-12 pr-12 bg-background/50 focus-visible:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 mt-4 agral-gradient text-white font-bold text-base shadow-lg hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Se verifică...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Intră în cont
                  </span>
                )}
              </Button>
            </form>
          </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-0 animate-in slide-in-from-right-2 duration-300">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-extrabold">Începe digitalizarea</h2>
                <p className="text-muted-foreground text-sm mt-1">30 zile gratuit. Fără card bancar.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {error && activeTab === "register" && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prenume</Label>
                    <Input id="firstName" name="firstName" placeholder="Ion" required className="h-11 bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nume</Label>
                    <Input id="lastName" name="lastName" placeholder="Popa" required className="h-11 bg-background/50" />
                  </div>
                </div>


                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="ion@ferma.ro"
                    required
                    className="h-11 bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Parolă <span className="font-normal text-xs text-muted-foreground">(min 8)</span></Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      name="password"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="h-11 pr-12 bg-background/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 mt-2 agral-gradient text-white font-bold text-base shadow-lg hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Se creează contul...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Creează cont
                    </span>
                  )}
                </Button>
                
                <p className="text-[10px] text-center text-muted-foreground/80 pt-2 pb-2">
                  Prin continuare, accepți Termenii și Politica de Confidențialitate Agral.
                </p>
              </form>
            </TabsContent>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
