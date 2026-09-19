"use client";

import { Bell, BellOff, Check, Plus } from "lucide-react";

type Props = {
  followed: boolean;
  notifications: boolean;
  label: string;
  onToggleFollow: () => void;
  onToggleNotifications: (enabled: boolean) => void;
};

export function FollowControl({ followed, notifications, label, onToggleFollow, onToggleNotifications }: Props) {
  return <div className="follow-control">
    <button type="button" className={followed ? "followed" : ""} aria-pressed={followed} onClick={onToggleFollow}>{followed ? <Check size={15}/> : <Plus size={15}/>} {followed ? "Suivi" : "Suivre " + label}</button>
    {followed && <button type="button" className="follow-notify" aria-label={notifications ? "Désactiver les notifications" : "Activer les notifications"} aria-pressed={notifications} onClick={()=>onToggleNotifications(!notifications)}>{notifications ? <Bell size={15}/> : <BellOff size={15}/>}</button>}
  </div>;
}
