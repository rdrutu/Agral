"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">Cont creat cu succes!</h2>
        <p className="text-muted-foreground">Te redirecționăm la dashboard...</p>
        <div className="mt-4 w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Creează cont gratuit</h1>
        <p className="text-muted-foreground">30 zile gratuit. Fără card bancar.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName" className="font-semibold">Prenume</Label>
            <Input id="firstName" name="firstName" placeholder="Ion" required className="h-12 text-base" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName" className="font-semibold">Nume</Label>
            <Input id="lastName" name="lastName" placeholder="Popa" required className="h-12 text-base" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="farmName" className="font-semibold">Numele fermei / exploatației</Label>
          <Input
            id="farmName"
            name="farmName"
            placeholder="ex: Ferma Popa SRL sau Agro-Popa"
            required
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="font-semibold">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ion.popa@ferma.ro"
            required
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="font-semibold">Parolă</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPass ? "text" : "password"}
              placeholder="Minim 8 caractere"
              required
              minLength={8}
              className="h-12 text-base pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Prin creare cont, accepți{" "}
          <a href="#" className="text-primary hover:underline">Termenii de utilizare</a> și{" "}
          <a href="#" className="text-primary hover:underline">Politica de confidențialitate</a>.
        </p>

        <Button
          type="submit"
          className="w-full h-12 agral-gradient text-white font-bold text-base"
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
              Creează cont gratuit
            </span>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          Ai deja cont?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Intră în cont
          </Link>
        </p>
      </div>
    </div>
  );
}
