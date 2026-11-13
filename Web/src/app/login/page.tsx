/**
 * The only screen you can reach without being signed in.
 *
 * This module belongs to the APP shell (src/app), and it is a client
 * component because signing in is an interaction, not a page load: the form
 * holds its own fields, calls useAuth(), and lets the provider re-render the
 * rest of the app once there is a person to render for.
 *
 * Two forms share this file, switched by one button, because they are the two
 * halves of the same question - "which workspace am I in?" - and the backend
 * answers it with two different endpoints:
 *
 *   POST /auth/login     an account that already exists
 *   POST /auth/register  a brand new workspace and its owner, in one call
 *
 * There is no POST /companies, so "create a workspace" has to mean "register",
 * and the register form asks for the company's name for that reason.
 */

"use client";

import { BriefcaseBusiness, LogIn, Plus, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { fieldInputClasses } from "@/components/ui/Dialog";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api/http";

/** One text field, since this page has six of them across its two forms. */
function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  maxLength,
  placeholder,
  required = true,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-[10px] font-bold text-slate-700" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        className={fieldInputClasses}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

export default function LoginPage() {
  const { status, login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in and opening /login by hand: go back to the work rather
  // than showing a second way to be in the same place.
  useEffect(() => {
    if (status === "signed-in") router.replace("/");
  }, [status, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProblem(null);
    setBusy(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({ company_name: companyName, name, email, password });
      }
      // useAuth flips to "signed-in", the dashboard layout notices, and the
      // provider starts loading. This only decides where to look meanwhile.
      router.replace("/");
    } catch (cause) {
      // ApiError.detail is written to be read ("Incorrect email or
      // password"), so it goes straight on screen. Anything else means the
      // request never got an answer.
      setProblem(
        cause instanceof ApiError
          ? cause.detail
          : "Could not reach the server. Start the API on port 8000 and try again.",
      );
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid size-[38px] place-items-center rounded-[12px] bg-brand text-white">
            <BriefcaseBusiness size={21} strokeWidth={2.2} />
          </span>
          <span className="font-display text-[22px] font-extrabold tracking-tight text-slate-900">
            Team<span className="text-brand">Ops</span>
          </span>
        </div>

        <h1 className="m-0 font-display text-[26px] font-bold tracking-tight text-slate-900">
          {mode === "login" ? "Welcome back" : "Start a workspace"}
        </h1>
        <p className="m-0 mt-1.5 text-[11px] leading-relaxed text-slate-500">
          {mode === "login"
            ? "Sign in to see your projects, tasks and teammates."
            : "One account creates the workspace and you as its owner."}
        </p>

        <form
          className="mt-6 rounded-[17px] border border-slate-200/80 bg-white p-5 shadow-card"
          onSubmit={handleSubmit}
        >
          {mode === "register" && (
            <>
              <TextField
                id="company-name"
                label="Workspace name"
                value={companyName}
                onChange={setCompanyName}
                maxLength={100}
                placeholder="e.g. Northwind Studio"
              />
              <TextField
                id="name"
                label="Your name"
                value={name}
                onChange={setName}
                maxLength={50}
                placeholder="e.g. Alex Morgan"
                autoComplete="name"
              />
            </>
          )}

          <TextField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            placeholder="you@company.com"
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            maxLength={128}
            placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
          />

          {problem && (
            <p
              className="m-0 mb-3.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] leading-relaxed text-red-700"
              role="alert"
            >
              {problem}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-brand text-[12px] font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
          >
            {mode === "login" ? <LogIn size={16} /> : <Plus size={16} />}
            {busy
              ? "One moment…"
              : mode === "login"
                ? "Sign in"
                : "Create workspace"}
          </button>

          <button
            type="button"
            className="mt-3 w-full text-[10px] font-bold text-brand hover:text-brand-dark"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setProblem(null);
            }}
          >
            {mode === "login"
              ? "No account yet? Start a workspace"
              : "Already have a workspace? Sign in"}
          </button>
        </form>

        {mode === "login" && (
          <div className="mt-4 rounded-[13px] border border-slate-200 bg-white/70 p-3.5 text-[10px] leading-relaxed text-slate-500">
            <strong className="mb-1 flex items-center gap-1.5 text-[10px] text-slate-700">
              <ShieldCheck size={14} className="text-brand" /> Demo accounts
            </strong>
            <p className="m-0">
              Every seeded account uses the password <code className="text-slate-700">demo1234</code>
              : <br />
              <button
                type="button"
                className="m-0 inline bg-transparent p-0 text-left text-[10px] text-brand underline"
                onClick={() => {
                  setEmail("alex@northwind.test");
                  setPassword("demo1234");
                }}
              >
                alex@northwind.test (owner)
              </button>
              {" · "}
              <button
                type="button"
                className="m-0 inline bg-transparent p-0 text-left text-[10px] text-brand underline"
                onClick={() => {
                  setEmail("ravi@northwind.test");
                  setPassword("demo1234");
                }}
              >
                ravi@northwind.test (admin)
              </button>
              {" · "}
              <button
                type="button"
                className="m-0 inline bg-transparent p-0 text-left text-[10px] text-brand underline"
                onClick={() => {
                  setEmail("priya@northwind.test");
                  setPassword("demo1234");
                }}
              >
                priya@northwind.test (member)
              </button>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
