"use client";
import React, { useState, useEffect } from 'react';

// === KONFIGURACE (Vlož své linky) ===
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
  const [searchCode, setSearchCode] = useState("");
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [lastOrderCode, setLastOrderCode] = useState<string | null>(null);

  // Zjištění stavu Otevřeno/Zavřeno
  useEffect(() => {
    const fetchStatus = async () => {
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
      }
    };
    fetchStatus();
  }, []);

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

    // 1. ZÁPIS DO TABULKY
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ code, customer: customerName, items: itemsList, price: total })
    });

    // 2. DISCORD
    const payload = {
      username: "Bean Machine",
      embeds: [{
        title: `Nová objednávka: ${code}`,
        color: 14251782,
        fields: [
          { name: "Zákazník", value: customerName, inline: true },
          { name: "Cena", value: `$${total}`, inline: true },
          { name: "Položky", value: itemsList.replace(/ \| /g, "\n") }
        ]
      }]
    };

    try {
      await fetch(DISCORD_WEBHOOK_URL, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      setLastOrderCode(code);
      setCart({});
      setCustomerName("");
      alert(`Objednávka odeslána! Tvůj kód: ${code}`);
      setView('home');
    } catch (e) { 
      alert("Objednávka odeslána do tabulky, ale Discord má výpadek."); 
    }
  };

  const zkontrolovatStav = async () => {
    if (!searchCode) return;
    setOrderStatus("Vyhledávání...");
    try {
      const response = await fetch(`${STATUS_SHEET_URL}&t=${Date.now()}`);
      const text = await response.text();
      const rows = text.split(/\r?\n/);
      const row = rows.find(r => r.toUpperCase().includes(searchCode.toUpperCase()));
      if (row) {
        const parts = row.split(',');
        setOrderStatus(parts[parts.length - 1].replace(/"/g, '').trim() || "Zpracovává se");
      } else {
        setOrderStatus("Kód nenalezen");
      }
    } catch (e) { setOrderStatus("Chyba spojení"); }
  };

  return (
    <div className="relative min-h-screen text-[#fdf8eb] font-sans">
      <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('/pozadi.png')` }}>
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 p-6 md:p-14 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-16 border-b border-white/10 pb-6">
          <div className="cursor-pointer" onClick={() => setView('home')}>
            <h1 className="text-5xl font-black uppercase text-white tracking-tighter">Bean Machine</h1>
            <div className="h-2 w-32 bg-[#d97706] mt-1"></div>
          </div>
          <div className={`px-6 py-2 rounded-full border-2 ${isOpen ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'} bg-black/50 text-xs font-black uppercase`}>
            {isOpen ? 'Otevřeno' : 'Zavřeno'}
          </div>
        </header>

        {view === 'home' && (
          <div className="flex flex-col items-center py-20">
            <h2 className="text-7xl font-black mb-16 uppercase text-white tracking-tighter">Vítejte</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">
              <div onClick={() => setView('order')} className="bg-[#23110a] border-4 border-white/5 p-12 rounded-[4rem] text-center cursor-pointer hover:border-[#d97706] transition-all">
                <div className="text-7xl mb-4">☕</div>
                <h3 className="text-3xl font-black uppercase">Objednat</h3>
              </div>
              <div onClick={() => setView('status')} className="bg-[#23110a] border-4 border-white/5 p-12 rounded-[4rem] text-center cursor-pointer hover:border-white transition-all">
                <div className="text-7xl mb-4">🔍</div>
                <h3 className="text-3xl font-black uppercase">Sledovat</h3>
              </div>
            </div>
          </div>
        )}

        {view === 'status' && (
          <div className="max-w-2xl mx-auto py-10">
            <button onClick={() => setView('home')} className="mb-6 text-[#d97706] font-bold uppercase tracking-widest">← Zpět</button>
            <div className="bg-[#23110a] p-10 rounded-[3rem] border-2 border-white/5 text-center">
              <h2 className="text-3xl font-black mb-10 uppercase">Stav objednávky</h2>
              <input 
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="BM-XXXX" 
                className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-6 text-2xl font-black outline-none text-[#d97706] text-center mb-6"
              />
              <button onClick={zkontrolovatStav} className="w-full py-6 rounded-2xl bg-[#d97706] text-[#23110a] font-black uppercase">Prověřit kód</button>
              {orderStatus && <p className="mt-8 text-4xl font-black uppercase">{orderStatus}</p>}
            </div>
          </div>
        )}

        {view === 'order' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7">
              <button onClick={() => setView('home')} className="mb-8 text-[#d97706] font-bold uppercase tracking-widest">← Zpět</button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {MENU_ITEMS.map(item => (
                  <div key={item.id} className="bg-white rounded-[3rem] p-10 flex flex-col items-center text-[#23110a] border-b-[8px] border-[#d97706]">
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <h3 className="text-2xl font-black uppercase text-center">{item.name}</h3>
                    <p className="text-gray-400 text-xs text-center mt-2 mb-6">{item.desc}</p>
                    <button onClick={() => addToCart(item)} className="bg-[#23110a] text-[#d97706] font-black px-12 py-3 rounded-full">${item.price}</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="bg-[#23110a] p-10 rounded-[4rem] border border-white/5 sticky top-10">
                <h2 className="text-3xl font-black mb-8 border-b border-white/10 pb-4 uppercase">Košík</h2>
                {Object.entries(cart).map(([id, item]) => (
                  <div key={id} className="flex justify-between items-center mb-4 text-white font-bold">
                    <span>{item.name} ({item.count}x)</span>
                    <span>${item.price * item.count}</span>
                  </div>
                ))}
                <div className="border-t-4 border-[#d97706] pt-6 mt-6">
                  <p className="text-4xl font-black text-[#d97706] mb-6">${total}</p>
                  <input 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                    placeholder="JMÉNO" 
                    className="w-full bg-black/40 border-2 border-white/5 p-4 rounded-xl text-white mb-4 outline-none focus:border-[#d97706]" 
                  />
                  <button 
                    onClick={potvrditObjednavku} 
                    disabled={!customerName || total === 0} 
                    className="w-full py-5 rounded-2xl bg-[#d97706] text-[#23110a] font-black uppercase disabled:opacity-50"
                  >
                    Potvrdit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}