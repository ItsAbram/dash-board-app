type AuthPanelProps = {
  email: string;
  password: string;
  status: string;
  isBusy: boolean;
  userEmail?: string;
  isSignedIn: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onSignOut: () => void;
};

export function AuthPanel({
  email,
  password,
  status,
  isBusy,
  userEmail,
  isSignedIn,
  onEmailChange,
  onPasswordChange,
  onSignIn,
  onSignUp,
  onSignOut,
}: AuthPanelProps) {
  if (isSignedIn) {
    return (
      <section className="grid gap-2 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-3">
        <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Account</p>
        <p className="break-words text-sm text-[#a1a1aa]">{userEmail}</p>
        <button className="outline-action px-3" type="button" onClick={onSignOut} disabled={isBusy}>
          {isBusy ? "Working..." : "Sign Out"}
        </button>
      </section>
    );
  }

  return (
    <section className="grid gap-3 rounded-xl border border-[#3a3a3a] bg-[#1f1f1f] p-5 text-left shadow-2xl shadow-black/30">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-[#f59e0b]">Account</p>
        <p className="mt-1 text-xs uppercase leading-relaxed text-[#a1a1aa]">Sign in before loading the dashboard.</p>
      </div>
      <input className="field" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="Email" type="email" />
      <input
        className="field"
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        placeholder="Password"
        type="password"
      />
      <p className="min-h-5 text-center text-xs uppercase leading-relaxed text-[#a1a1aa]">{status}</p>
      <div className="grid grid-cols-2 gap-2">
        <button className="action" type="button" onClick={onSignIn} disabled={isBusy}>
          {isBusy ? "Signing in..." : "Sign In"}
        </button>
        <button className="outline-action px-3" type="button" onClick={onSignUp} disabled={isBusy}>
          {isBusy ? "Creating..." : "Create"}
        </button>
      </div>
    </section>
  );
}
