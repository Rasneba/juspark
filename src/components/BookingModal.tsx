"use client";

import { useState } from "react";

interface BookingModalProps {
  space: any;
  onClose: () => void;
  onConfirm?: () => void;
}

export default function BookingModal({ space, onClose, onConfirm }: BookingModalProps) {
  const [duration, setDuration] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "card">("wallet");
  const [step, setStep] = useState<"checkout" | "processing" | "success">("checkout");
  const [ticket, setTicket] = useState<any>(null);

  const pricing = Array.isArray(space.pricing) ? space.pricing : [];
  const hourly = pricing.find((p: any) => String(p.rate_type || p.rateType).toLowerCase() === "hourly");
  const hourlyCost = hourly ? Number(hourly.price) : 35;
  const serviceFee = 0.5;
  const subTotal = hourlyCost * duration + serviceFee;
  const totalCost = Math.max(0, subTotal);

  const handlePay = () => {
    setStep("processing");
    setTimeout(() => {
      const gateCodes = ["GATE-4921", "KEY-9084", "LOCK-3382", "SECURE-1025", "BOX-5561"];
      setTicket({
        id: `bk-${Math.floor(100000 + Math.random() * 900000)}`,
        gateCode: gateCodes[Math.floor(Math.random() * gateCodes.length)],
        totalCost,
        durationHours: duration,
      });
      setStep("success");
      onConfirm?.();
    }, 2000);
  };

  const spaceTypeIcon = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t === "garage") return "🏢";
    if (t === "driveway") return "🏡";
    if (t === "street") return "🛣";
    return "🅿";
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      {step === "checkout" && (
        <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-zinc-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-zinc-950 font-display">Confirm Parking Booking</h3>
              <p className="text-xs text-zinc-500">Instantly reserve this spot</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition-colors">✕</button>
          </div>

          {/* Spot summary */}
          <div className="p-6 bg-zinc-50/60 border-b border-zinc-200 flex items-center gap-4">
            <div className="w-16 h-16 bg-green-50 border border-ethio-green/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
              {spaceTypeIcon(space.space_type || space.spaceType)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-zinc-950 text-base truncate">{space.name}</h4>
              <p className="text-xs text-zinc-500 truncate">{space.address}</p>
              {space.ratingAvg > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-ethio-yellow">★</span>
                  <span className="text-xs font-semibold text-zinc-700">{Number(space.ratingAvg).toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable contents */}
          <div className="p-6 space-y-5 max-h-[50vh] overflow-y-auto">
            {/* Duration */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-zinc-800">Parking Duration</label>
                <span className="text-ethio-green font-extrabold text-sm bg-green-50 border border-ethio-green/10 px-3.5 py-1 rounded-full font-display">
                  {duration} {duration === 1 ? "Hour" : "Hours"}
                </span>
              </div>
              <input type="range" min="1" max="12" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-zinc-400 mt-2 font-mono">
                <span>1h</span><span>3h</span><span>6h</span><span>9h</span><span>12h</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-800 block">Payment Method</label>
              <button onClick={() => setPaymentMethod("wallet")} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${paymentMethod === "wallet" ? "bg-green-50/40 border-ethio-green shadow-md" : "bg-zinc-50/50 border-zinc-200 hover:border-zinc-300"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${paymentMethod === "wallet" ? "bg-ethio-green/10 text-ethio-green" : "bg-zinc-100 text-zinc-500"}`}>💰</div>
                  <div>
                    <div className="font-bold text-sm text-zinc-900">ParkEth Wallet</div>
                    <div className="text-xs text-zinc-500 font-semibold">Balance: ETB 45.00</div>
                  </div>
                </div>
                {paymentMethod === "wallet" && <div className="w-5 h-5 rounded-full bg-ethio-green flex items-center justify-center text-white text-xs font-bold">✓</div>}
              </button>
              <button onClick={() => setPaymentMethod("card")} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${paymentMethod === "card" ? "bg-green-50/40 border-ethio-green shadow-md" : "bg-zinc-50/50 border-zinc-200 hover:border-zinc-300"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${paymentMethod === "card" ? "bg-ethio-green/10 text-ethio-green" : "bg-zinc-100 text-zinc-500"}`}>💳</div>
                  <div>
                    <div className="font-bold text-sm text-zinc-900">Credit / Debit Card</div>
                    <div className="text-xs text-zinc-500 font-semibold">CBE ending in **** 8420</div>
                  </div>
                </div>
                {paymentMethod === "card" && <div className="w-5 h-5 rounded-full bg-ethio-green flex items-center justify-center text-white text-xs font-bold">✓</div>}
              </button>
            </div>

            {/* Price Breakdown */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-500"><span>Rate per hour</span><span>ETB {hourlyCost.toFixed(2)}</span></div>
              <div className="flex justify-between text-zinc-500"><span>Parking charge ({duration}h)</span><span>ETB {(hourlyCost * duration).toFixed(2)}</span></div>
              <div className="flex justify-between text-zinc-500"><span>Secure processing fee</span><span>ETB {serviceFee.toFixed(2)}</span></div>
              <div className="border-t border-zinc-200/80 my-2 pt-2 flex justify-between font-extrabold text-zinc-900 text-sm">
                <span>Total Due</span>
                <span className="text-ethio-green">ETB {totalCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-500 justify-center">
              <span>🛡️</span>
              <span>Protected by PARKme Ethiopia Peace of Mind Guarantee</span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-zinc-50 border-t border-zinc-200 flex flex-col gap-3">
            <button onClick={handlePay} className="w-full py-4 rounded-2xl bg-ethio-green hover:bg-green-700 font-bold text-white text-base shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <span>Book & Pay ETB {totalCost.toFixed(2)}</span>
              <span>→</span>
            </button>
            <p className="text-[10px] text-center text-zinc-500">By booking, you agree to our parking terms and guidelines.</p>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="bg-white border border-zinc-200 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl flex flex-col items-center justify-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-ethio-green/15" />
            <div className="absolute inset-0 rounded-full border-4 border-ethio-green border-t-transparent animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-zinc-950 mb-2 font-display">Authorizing Booking</h3>
          <p className="text-xs text-zinc-500 max-w-xs">Confirming parking reservation and locking in your secure access credentials...</p>
        </div>
      )}

      {step === "success" && ticket && (
        <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
          {/* Success banner */}
          <div className="bg-gradient-to-br from-ethio-green to-teal-700 p-6 text-center text-white relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-black/10 rounded-full blur-xl" />
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg text-2xl">✓</div>
            <h3 className="text-xl font-black uppercase tracking-tight font-display">Spot Secured!</h3>
            <p className="text-xs text-emerald-50/90 font-medium mt-1">Receipt & pass generated successfully.</p>
          </div>

          <div className="p-6 space-y-5 relative">
            <div className="text-center pb-4 border-b border-zinc-200">
              <h4 className="text-lg font-black text-zinc-950 font-display">{space.name}</h4>
              <p className="text-xs text-zinc-500 mt-1">{space.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-zinc-200 pb-4">
              <div>
                <span className="text-zinc-400 block uppercase text-[10px]">PASS CODE</span>
                <span className="text-zinc-900 font-extrabold text-sm bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded mt-1 inline-block">{ticket.gateCode}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-400 block uppercase text-[10px]">DURATION</span>
                <span className="text-zinc-800 font-bold text-sm mt-1 inline-block">{ticket.durationHours} Hours</span>
              </div>
              <div>
                <span className="text-zinc-400 block uppercase text-[10px]">AMOUNT PAID</span>
                <span className="text-ethio-green font-bold text-sm mt-1 inline-block">ETB {ticket.totalCost.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-400 block uppercase text-[10px]">BOOKING ID</span>
                <span className="text-zinc-600 text-[11px] mt-1 inline-block">{ticket.id}</span>
              </div>
            </div>

            {/* QR Code placeholder */}
            <div className="flex flex-col items-center justify-center py-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="w-28 h-28 bg-white border-2 border-zinc-900 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-24 h-24">
                  <rect x="5" y="5" width="25" height="25" fill="#09090b" rx="3"/>
                  <rect x="70" y="5" width="25" height="25" fill="#09090b" rx="3"/>
                  <rect x="5" y="70" width="25" height="25" fill="#09090b" rx="3"/>
                  <rect x="10" y="10" width="15" height="15" fill="white" rx="2"/>
                  <rect x="75" y="10" width="15" height="15" fill="white" rx="2"/>
                  <rect x="10" y="75" width="15" height="15" fill="white" rx="2"/>
                  <rect x="14" y="14" width="7" height="7" fill="#09090b" rx="1"/>
                  <rect x="79" y="14" width="7" height="7" fill="#09090b" rx="1"/>
                  <rect x="14" y="79" width="7" height="7" fill="#09090b" rx="1"/>
                  <rect x="35" y="5" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="48" y="5" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="35" y="18" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="48" y="18" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="35" y="35" width="8" height="8" fill="#128a42" rx="1"/>
                  <rect x="48" y="35" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="5" y="35" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="5" y="48" width="8" height="8" fill="#128a42" rx="1"/>
                  <rect x="18" y="48" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="35" y="48" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="48" y="48" width="8" height="8" fill="#128a42" rx="1"/>
                  <rect x="70" y="35" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="83" y="35" width="8" height="8" fill="#128a42" rx="1"/>
                  <rect x="70" y="48" width="8" height="8" fill="#128a42" rx="1"/>
                  <rect x="83" y="48" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="70" y="70" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="83" y="70" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="70" y="83" width="8" height="8" fill="#128a42" rx="1"/>
                  <rect x="83" y="83" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="35" y="70" width="8" height="8" fill="#09090b" rx="1"/>
                  <rect x="48" y="70" width="8" height="8" fill="#128a42" rx="1"/>
                  <rect x="35" y="83" width="8" height="8" fill="#128a42" rx="1"/>
                  <rect x="48" y="83" width="8" height="8" fill="#09090b" rx="1"/>
                </svg>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono mt-2 uppercase tracking-widest">Scan to check in/out</p>
            </div>

            <div className="bg-green-50/60 p-4 rounded-2xl border border-green-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="animate-pulse text-ethio-green">⏱</span>
                <span className="text-zinc-800 font-semibold">Countdown active</span>
              </div>
              <span className="text-ethio-green font-mono font-bold bg-white border border-ethio-green/20 px-2.5 py-1 rounded-full">
                {ticket.durationHours}:00:00
              </span>
            </div>
          </div>

          <div className="px-6 pb-6 bg-zinc-50 flex flex-col gap-2">
            <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-sm transition-colors text-center">Close Receipt</button>
          </div>
        </div>
      )}
    </div>
  );
}
