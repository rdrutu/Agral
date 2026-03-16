"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Bun venit înapoi!</h1>
        <p className="text-muted-foreground">Intră în contul tău Agral</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2">
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

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password" className="font-semibold">Parolă</Label>
            <a href="#" className="text-sm text-primary hover:underline">Ai uitat parola?</a>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              required
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

        <Button
          type="submit"
          className="w-full h-12 agral-gradient text-white font-bold text-base"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Se procesează...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Intră în cont
            </span>
          )}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-muted-foreground">
          Nu ai cont?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Înregistrează-te gratuit
          </Link>
        </p>
      </div>
    </div>
  );
}
