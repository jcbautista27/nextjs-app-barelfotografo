"use client";

import { useState } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LoginUser = {
  id: string;
  name: string;
  role: string;
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export function LoginForm({ users }: { users: LoginUser[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    users.length === 1 ? users[0].id : null
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = users.find((u) => u.id === selectedId) ?? null;
  const canSubmit = selected !== null && pin.length >= 4 && !loading;

  async function submit() {
    if (!selected || pin.length < 4 || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, pin }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.redirect) {
        window.location.href = data.redirect;
        return;
      }
      setPin("");
      setError("PIN incorrecto. Inténtalo de nuevo.");
    } catch {
      setPin("");
      setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function press(key: string) {
    if (key === "back") {
      setPin((p) => p.slice(0, -1));
      setError("");
      return;
    }
    if (key === "" || pin.length >= 6) return;
    setPin((p) => p + key);
    setError("");
  }

  if (users.length === 0) {
    return (
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        Aún no hay usuarios registrados. Ejecuta{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          npm run seed:owner
        </code>{" "}
        para crear la cuenta inicial del dueño.
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center">
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => {
              setSelectedId(u.id);
              setPin("");
              setError("");
            }}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm",
              selectedId === u.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted text-foreground hover:border-primary/50"
            )}
          >
            {u.name}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-center gap-3" aria-label="PIN">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-3 rounded-full border",
              i < pin.length
                ? "border-primary bg-primary"
                : "border-muted-foreground"
            )}
          />
        ))}
      </div>

      <div className="grid w-60 grid-cols-3 gap-2.5">
        {KEYS.map((key, i) =>
          key === "" ? (
            <span key={i} />
          ) : key === "back" ? (
            <Button
              key={i}
              type="button"
              variant="secondary"
              size="icon"
              className="h-12 w-full text-base"
              onClick={() => press("back")}
              aria-label="Borrar último dígito"
            >
              <Delete className="size-5" />
            </Button>
          ) : (
            <Button
              key={i}
              type="button"
              variant="secondary"
              size="icon"
              className="h-12 w-full text-base font-semibold"
              onClick={() => press(key)}
              disabled={loading}
            >
              {key}
            </Button>
          )
        )}
      </div>

      {error ? (
        <p
          className="mt-4 text-center text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button
        className="mt-5 w-60"
        onClick={submit}
        disabled={!canSubmit}
      >
        {loading ? "Validando…" : "Entrar"}
      </Button>
    </div>
  );
}