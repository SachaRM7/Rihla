"use client";

import { useEffect, useState } from "react";

export function OfflineRegistration() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let reloading = false;
    let acceptedUpdate = false;
    const onControllerChange = () => {
      if (acceptedUpdate && !reloading) { reloading = true; window.location.reload(); }
    };
    const onUpdateFound = () => {
      const installing = registration?.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (!disposed && installing.state === "redundant") setError(true);
        if (!disposed && installing.state === "installed" && navigator.serviceWorker.controller) setWaiting(registration?.waiting ?? null);
      });
    };
    const onAccept = () => { acceptedUpdate = true; };
    window.addEventListener("rihla:accept-update", onAccept);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((value) => {
      if (disposed) return;
      registration = value;
      if (value.waiting) setWaiting(value.waiting);
      value.addEventListener("updatefound", onUpdateFound);
    }).catch(() => { if (!disposed) setError(true); });
    return () => {
      disposed = true;
      registration?.removeEventListener("updatefound", onUpdateFound);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("rihla:accept-update", onAccept);
    };
  }, []);

  if (waiting) return <aside className="offline-notice" aria-label="Mise à jour disponible">
    <p>Une nouvelle version de Rihla est prête. Recharger interrompt la lecture en cours.</p>
    <button type="button" className="secondary-action" onClick={() => {
      window.dispatchEvent(new Event("rihla:accept-update"));
      waiting.postMessage({ type: "SKIP_WAITING" });
    }}>Recharger</button>
    <button type="button" className="text-action" onClick={() => setWaiting(null)}>Plus tard</button>
  </aside>;
  if (error) return <aside className="offline-notice" role="status">
    <p>La préparation hors connexion a échoué. Vos écoutes en ligne restent disponibles.</p>
    <button type="button" className="text-action" onClick={() => window.location.reload()}>Réessayer</button>
    <button type="button" className="text-action" onClick={() => setError(false)}>Fermer</button>
  </aside>;
  return null;
}
