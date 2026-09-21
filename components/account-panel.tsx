"use client";

import { KeyRound, LoaderCircle, LogIn, LogOut, Mail, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import type { LocalLibrary } from "@/hooks/use-local-library";
import { useSupabaseAuth, type AuthMode } from "@/hooks/use-supabase-auth";

type Props = { library: LocalLibrary; hydrated: boolean };

export function AccountPanel({ library, hydrated }: Props) {
  const auth = useSupabaseAuth(library, hydrated);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "recovery") await auth.requestPasswordReset(email);
    else if (mode === "signup") await auth.signUp(email, password, displayName);
    else await auth.signIn(email, password);
  };

  return <section className="data-settings account-panel" aria-labelledby="account-settings-title">
    <div className="section-title-row"><div><p className="eyebrow">Synchronisation facultative</p><h2 id="account-settings-title">Compte RIHLA</h2></div><ShieldCheck size={20}/></div>
    {!auth.configured && <div className="account-guest-state"><UserRound size={20}/><div><strong>Mode invité actif</strong><p>Vos données restent locales. Configurez Supabase pour activer la connexion et la restauration sur plusieurs appareils.</p></div></div>}
    {auth.configured && auth.loading && !auth.user && <p className="account-feedback"><LoaderCircle className="spin" size={16}/>Vérification de la session…</p>}
    {auth.configured && !auth.loading && !auth.user && <>
      <p className="preferences-copy">Créez un compte pour retrouver vos favoris, notes, playlists et progressions. L’usage invité ne nécessite aucun compte.</p>
      <form className="account-form" onSubmit={submit}>
        {mode === "signup" && <label><span>Nom affiché</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" maxLength={120} required /></label>}
        <label><span>Email</span><span className="account-input"><Mail size={15}/><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></span></label>
        {mode !== "recovery" && <label><span>Mot de passe</span><span className="account-input"><KeyRound size={15}/><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required /></span></label>}
        <button type="submit" className="primary-action" disabled={auth.loading}>{auth.loading ? <LoaderCircle className="spin" size={16}/> : <LogIn size={16}/>} {mode === "signup" ? "Créer mon compte" : mode === "recovery" ? "Envoyer le lien" : "Se connecter"}</button>
      </form>
      <div className="account-links">
        {mode !== "signin" && <button type="button" className="text-action" onClick={() => { auth.clearMessages(); setMode("signin"); }}>J’ai déjà un compte</button>}
        {mode !== "signup" && <button type="button" className="text-action" onClick={() => { auth.clearMessages(); setMode("signup"); }}>Créer un compte</button>}
        {mode !== "recovery" && <button type="button" className="text-action" onClick={() => { auth.clearMessages(); setMode("recovery"); }}>Mot de passe oublié ?</button>}
      </div>
    </>}
    {auth.configured && auth.user && <div className="account-authenticated">
      <div className="account-identity"><span className="account-avatar"><UserRound size={18}/></span><div><strong>{auth.user.email ?? "Compte connecté"}</strong><small>Session persistante activée · mode invité conservé sur cet appareil</small></div></div>
      <p className="account-migration-note">À la première connexion, le snapshot local est envoyé comme événement privé de synchronisation. Les données ne sont pas publiées.</p>
      <form className="account-form account-inline-form" onSubmit={async (event) => { event.preventDefault(); if (newEmail.trim()) await auth.updateEmail(newEmail); }}>
        <label><span>Changer d’email</span><input type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder={auth.user.email ?? "nouvel email"} autoComplete="email" required /></label>
        <button type="submit" className="secondary-action" disabled={auth.loading}>Confirmer l’email</button>
      </form>
      <form className="account-form account-inline-form" onSubmit={async (event) => { event.preventDefault(); if (newPassword) await auth.updatePassword(newPassword); }}>
        <label><span>Changer de mot de passe</span><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="8 caractères minimum" autoComplete="new-password" minLength={8} required /></label>
        <button type="submit" className="secondary-action" disabled={auth.loading}>Mettre à jour</button>
      </form>
      <div className="account-actions"><button type="button" className="secondary-action" onClick={() => void auth.signOut()} disabled={auth.loading}><LogOut size={15}/>Se déconnecter</button><button type="button" className="danger-action" onClick={() => { if (window.confirm("Supprimer définitivement votre compte Supabase et toutes ses données synchronisées ?")) void auth.deleteAccount(); }} disabled={auth.loading}><Trash2 size={15}/>Supprimer le compte</button></div>
    </div>}
    {auth.error && <p className="account-feedback error" role="alert">{auth.error}</p>}
    {auth.notice && <p className="account-feedback success" role="status">{auth.notice}</p>}
  </section>;
}
