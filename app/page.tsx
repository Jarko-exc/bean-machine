"use client";
import React, { useState } from 'react';

// === KONFIGURACE ===
const STATUS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS70W8M4EY7hX06go1OZZKDC_YQo1DB6W_iyxlxyV-JCojRrlozGecPLWlrdz5wPu6cvGrLAeneEgJW/pub?output=csv";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxz4X7fpgMrrQfrxE5kGsP3Yy-taMcFjAFHXsGzO0w701G8G-rX_8ZJ8q2tpx-ByP2y/exec";
const DISCORD_WEBHOOK_URL = "TVŮJ_DISCORD_WEBHOOK_ZDE";

const MENU_ITEMS = [
  { id: 1, name: "Matcha Cafe", desc: "Energie z dálného východu.", price: 1000, icon: "☕" },
  { id: 2, name: "Mine-Ice Pop", desc: "Maximální hydratace.", price: 1000, icon: "☕" },
  { id: 3, name: "Bábovka", desc: "Domácí klasika ke kávě.", price: 3000, icon: "🍴" },
  { id: 4, name: "Sushi", desc: "Čerstvé ryby a jemná rýže.", price: 3000, icon: "🍴" },
  { id: 5, name: "Řízek se salátem", desc: "Křupavý řízek se salátem.", price: 3000, icon: "🍴" },
  { id: 6, name: "Bombóny", desc: "Sladká tečka na závěr.", price: 1500, icon: "🍴" },
];

export default function BeanMachinePortal() {
  const [view, setView] = useState<'home' | 'order' | 'status'>('home');
  const [cart, setCart] = useState<{ [key: number]: { name: string, price: number, count: number } }>({});
  const [customerName, setCustomerName] = useState("");
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  // FUNKCE PRO ZJIŠTĚNÍ STATUSU PO KLIKNUTÍ
  const checkStoreStatus = async () => {
    setLoadingStatus(true);
    try {
      const response = await fetch(`${STATUS_SHEET_URL}&t=${Date.now()}`);
      const text = await response.text();
      
      if (text.toUpperCase().includes("OTEVŘENO")) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    } catch (e) {
      setIsOpen(false);
    } finally {
      setLoadingStatus(false);
    }
  };

  const addToCart = (item: typeof MENU_ITEMS[0]) => {
    setCart(prev => ({
      ...prev,
      [item.id]: { name: item.name, price: item.price, count: (prev[item.id]?.count || 0) + 1 }
    }));
  };

  const total = Object.entries(cart).reduce((acc, [_, item]) => acc + (item.price * item.count), 0);

  const potvrditObjednavku = async () => {
    const code = `BM-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemsList = Object.entries(cart).map(([_, item]) => `${item.name} (${item.count}x)`).join(" | ");

    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ code, customer: customerName, items: itemsList, price: total })
    });

    try {
      await fetch(DISCORD_WEBHOOK_URL, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({
          content: `☕ **Nová objednávka!**\n**Kód:** ${code}\n**Zákazník:** ${customerName}\n**Cena:** ${total} B`
        }) 
      });
      alert(`Objednáno! Kód: ${code}`);
      setCart({});
      setView('home');
    } catch (e) { alert("Chyba Discordu, ale v tabulce by to mělo být."); }
  };

  return (
    <div className="relative min-h-screen text-[#fdf8eb] font-sans">
      <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('/pozadi.png')` }}>
        <div className="absolute inset-0 bg-black/85 backdrop-blur-[3px]"></div>
      </div>

      <div className="relative z-10 p-6 md:p-14 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-16 border-b border-white/10 pb-6">
          <div className="cursor-pointer" onClick={() => setView('home')}>
            <h1 className="text-5xl font-black uppercase text-white tracking-tighter">Bean Machine</h1>
            <div className="h-2 w-32 bg-[#d97706] mt-1"></div>
          </div>

          {/* --- TLAČÍTKO STATUSU PODNIKU --- */}
          <button 
            onClick={checkStoreStatus}
            disabled={loadingStatus}
            className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-2xl border-2 ${
              isOpen === null ? 'border-orange-500/50 text-orange-500 bg-orange-500/10' : 
              isOpen ? 'border-green-500 text-green-500 bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 
              'border-red-500 text-red-500 bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
            }`}
          >
            {loadingStatus ? 'Zjišťuji...' : 
             isOpen === null ? 'Status podniku' : 
             isOpen ? '● Otevřeno' : '○ Zavřeno'}
          </button>
        </header>

        {/* ... zbytek kódu (home, order, status views) zůstává stejný ... */}
        {view === 'home' && (
          <div className="flex flex-col items-center py-20 animate-in fade-in zoom-in duration-500">
            <h2 className="text-8xl font-black mb-16 uppercase text-white tracking-tighter drop-shadow-2xl">Vítejte</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">
              <div onClick={() => setView('order')} className="group bg-[#23110a] border-4 border-white/5 p-12 rounded-[4rem] text-center cursor-pointer hover:border-[#d97706] transition-all shadow-2xl">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">☕</div>
                <h3 className="text-3xl font-black uppercase">Objednat</h3>
              </div>
              <div onClick={() => setView('status')} className="group bg-[#23110a] border-4 border-white/5 p-12 rounded-[4rem] text-center cursor-pointer hover:border-white transition-all shadow-2xl">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">🔍</div>
                <h3 className="text-3xl font-black uppercase">Sledovat</h3>
              </div>
            </div>
          </div>
        )}
        
        {/* Přidej si sem zpět ty sekce pro 'order' a 'status' z minulého kódu, pokud je tam chceš mít */}
      </div>
    </div>
  );
}