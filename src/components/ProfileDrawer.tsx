"use client";

import { useState } from "react";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  bookings?: any[];
  onTopUp?: (amount: number) => void;
  onCancelBooking?: (id: string) => void;
}

export default function ProfileDrawer({ isOpen, onClose, user, bookings = [], onTopUp, onCancelBooking }: ProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<"passes" | "deposit" | "hosting">("passes");
  const [depositAmount, setDepositAmount] = useState(0);

  if (!isOpen) return null;

  const activeBookings = bookings.filter((b: any) => b.status === "active" || b.status === "ACTIVE");

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[150]" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-[151] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-extrabold text-lg text-zinc-950">My Profile</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors">✕</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ethio-green to-[#0f7a39] flex items-center justify-center text-white font-bold text-lg shadow-md">
              {(user?.name || "U")[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-sm text-zinc-900">{user?.name || "Guest User"}</div>
              <div className="text-xs text-zinc-500">{user?.email || "guest@parkme.et"}</div>
            </div>
          </div>
          <div className="mt-4 px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between font-mono">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">PR Wallet</span>
            <span className="text-xs font-bold text-ethio-green">ETB {(user?.walletBalance || 45).toFixed(2)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 px-5">
          {[
            { id: "passes" as const, label: "🎫 Passes" },
            { id: "deposit" as const, label: "💰 Deposit" },
            { id: "hosting" as const, label: "🏡 Hosting" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${
                activeTab === tab.id ? "border-ethio-green text-ethio-green" : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "passes" && (
            <div className="space-y-3">
              {activeBookings.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">🎫</div>
                  <p className="text-sm font-semibold text-zinc-800">No Active Passes</p>
                  <p className="text-xs text-zinc-500 mt-1">Book a spot to get your Ethiopian Flag Pass ticket.</p>
                </div>
              ) : (
                activeBookings.map((booking: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50">
                    <div className="h-1 rounded-full mb-3" style={{ background: "linear-gradient(90deg, #009900 33%, #FFCC00 66%, #CC0000 100%)" }} />
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-sm text-zinc-900">{booking.spot_name || booking.spotName || "Parking Spot"}</div>
                        <div className="text-[11px] text-zinc-500">{booking.gate_code || booking.gateCode || "N/A"}</div>
                      </div>
                      <span className="text-ethio-green font-mono font-bold text-xs">ETB {Number(booking.total_cost || booking.totalCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">{booking.duration_hours || booking.durationHours || 2}h session</span>
                      <span className="font-mono font-bold text-ethio-green bg-green-50 px-2 py-0.5 rounded-full border border-ethio-green/20">
                        {booking.duration_hours || booking.durationHours || 2}:00:00
                      </span>
                    </div>
                    <button onClick={() => onCancelBooking?.(booking.id)} className="mt-3 w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold rounded-xl transition-colors">Cancel Booking</button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "deposit" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-2">Quick Deposit</label>
                <div className="grid grid-cols-3 gap-2">
                  {[200, 500, 1000].map((amount) => (
                    <button key={amount} onClick={() => { setDepositAmount(amount); onTopUp?.(amount); }} className="py-3 bg-zinc-100 hover:bg-ethio-green hover:text-white text-zinc-800 rounded-2xl text-sm font-bold transition-all border border-zinc-200 active:scale-95">
                      ETB {amount}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <span>🔒</span>
                <span>Funds held in secure escrow until parking completed.</span>
              </div>
            </div>
          )}

          {activeTab === "hosting" && (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🏡</div>
              <p className="text-sm font-semibold text-zinc-800">Host Your Space</p>
              <p className="text-xs text-zinc-500 mt-1 mb-4">List your driveway, garage, or rooftop and earn.</p>
              <a href="/host" className="inline-block px-6 py-3 bg-ethio-green hover:bg-green-700 text-white rounded-2xl text-sm font-bold transition-all shadow-md">Go to Host Dashboard</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
