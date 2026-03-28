"use client";

import { useState, useEffect } from "react";

interface TemporaryGateProps {
  children: React.ReactNode;
}

export function TemporaryGate({ children }: TemporaryGateProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const access = localStorage.getItem("agral_temp_access");
    if (access === "true") {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "agral" && password === "agral123") {
      localStorage.setItem("agral_temp_access", "true");
      setIsAuthorized(true);
    } else {
      setError("Credentiale invalide. Incearca din nou.");
    }
  };

  if (isAuthorized === null) return null; // Loading state

  if (!isAuthorized) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>Acces Temporar - Agral</h1>
          <p style={{ marginBottom: '20px', color: '#6b7280' }}>Introdu datele de acces pentru a vedea site-ul.</p>
          
          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Utilizator</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Parola</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
              />
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>}
            <button
              type="submit"
              style={{
                backgroundColor: '#10b981',
                color: '#fff',
                padding: '12px',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Deblochează
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
