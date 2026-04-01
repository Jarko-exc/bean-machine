"use client";
import React, { useState, useEffect } from 'react';

// === KONFIGURACE ===
const STATUS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS70W8M4EY7hX06go1OZZKDC_YQo1DB6W_iyxlxyV-JCojRrlozGecPLWlrdz5wPu6cvGrLAeneEgJW/pub?output=csv"; 
const DISCORD_WEBHOOK_URL = "TVŮJ_DISCORD_WEBHOOK"; // <--- TADY VLOŽ SVŮJ WEBHOOK

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

 useEffect(() => {
  const fetchStatus = async () => {
  try {
    // Teď se ptáme našeho vlastního serveru, ne Googlu přímo
    const response = await fetch('/api/status'); 

    if (!response.ok) throw new Error("Chyba serveru");
    
    const data = await response.json();
    const stringifiedData = JSON.stringify(data).toUpperCase();

    if (stringifiedData.includes("OTEVŘENO")) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  } catch (e) {
    console.error("Chyba:", e);
    setIsOpen(false);
  }
};

    fetchStatus();
    // ODEBRALI JSME setInterval - teď se to spustí jen jednou při načtení
  }, []); // Prázdné závorky zajistí, že se to spustí jen 1x

  const addToCart = (item: typeof MENU_ITEMS[0]) => {
    setCart(prev => ({
      ...prev,
      [item.id]: { name: item.name, price: item.price, count: (prev[item.id]?.count || 0) + 1 }
    }));
  };

  const updateQuantity = (id: number, val: string) => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      const newCart = { ...cart };
      delete newCart[id];
      setCart(newCart);
    } else {
      setCart(prev => ({ ...prev, [id]: { ...prev[id], count: num } }));
    }
  };

  const removeOne = (id: number) => {
    setCart(prev => {
      const current = prev[id];
      if (!current) return prev;
      if (current.count > 1) {
        return { ...prev, [id]: { ...current, count: current.count - 1 } };
      }
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
  };

  const total = Object.entries(cart).reduce((acc, [_, item]) => acc + (item.price * item.count), 0);

  const potvrditObjednavku = async () => {
    const code = `BM-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // POUŽÍVÁME | MÍSTO ČÁRKY, ABY SE NEROZBILO CSV V TABULCE
    const itemsForTable = Object.entries(cart).map(([_, item]) => `${item.name} (${item.count}x)`).join(" | ");
    const itemsForDiscord = Object.entries(cart).map(([_, item]) => `${item.name} (${item.count}x)`).join("\n");

    // ZÁPIS DO TABULKY
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ code, customer: customerName, items: itemsForTable, price: total })
    });

    // DISCORD
    const payload = {
      username: "Bean Machine",
      embeds: [{
        title: `Nová objednávka: ${code}`,
        color: 14251782,
        fields: [
          { name: "Zákazník", value: customerName, inline: true },
          { name: "Cena", value: `$${total}`, inline: true },
          { name: "Položky", value: itemsForDiscord }
        ]
      }]
    };

    try {
      await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setLastOrderCode(code);
      setCart({});
      setCustomerName("");
      alert(`Objednávka odeslána! Tvůj kód pro sledování: ${code}`);
      setView('home');
    } catch (e) { alert("Chyba spojení s Discordem."); }
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
        // VŽDY BEREME POSLEDNÍ SLOUPEC (INDEX LENGTH - 1)
        const statusValue = parts[parts.length - 1].replace(/"/g, '').trim();
        setOrderStatus(statusValue || "Zpracovává se");
      } else { 
        setOrderStatus("Kód nenalezen"); 
      }
    } catch (e) { setOrderStatus("Chyba spojení"); }
  };

  return (
    <div className="relative min-h-screen text-[#fdf8eb] font-sans overflow-x-hidden">
      <style>{`input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}`}</style>
      
      {/* POZADÍ */}
      <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('/pozadi.png')` }}>
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 p-6 md:p-14 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-16 border-b border-white/10 pb-6">
          <div className="cursor-pointer" onClick={() => setView('home')}>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-white">Bean Machine</h1>
            <div className="h-2 w-32 bg-[#d97706] mt-1"></div>
          </div>
          <div className={`px-6 py-2 rounded-full border-2 ${isOpen ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'} bg-black/50 text-xs font-black uppercase tracking-widest`}>
            {isOpen ? 'Otevřeno' : 'Zavřeno'}
          </div>
        </header>

        {/* ROZCESTÍ */}
        {view === 'home' && (
          <div className="flex flex-col items-center py-20 animate-in fade-in zoom-in duration-500">
            <h2 className="text-7xl font-black mb-16 uppercase text-white tracking-tighter drop-shadow-2xl">Vítejte</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">
              <div onClick={() => setView('order')} className="group bg-[#23110a] border-4 border-white/5 p-12 rounded-[4rem] text-center cursor-pointer hover:border-[#d97706] transition-all hover:-translate-y-2 shadow-2xl">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">☕</div>
                <h3 className="text-3xl font-black uppercase">Objednat</h3>
              </div>
              <div onClick={() => setView('status')} className="group bg-[#23110a] border-4 border-white/5 p-12 rounded-[4rem] text-center cursor-pointer hover:border-white transition-all hover:-translate-y-2 shadow-2xl">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">🔍</div>
                <h3 className="text-3xl font-black uppercase">Sledovat</h3>
              </div>
            </div>
            {lastOrderCode && <div className="mt-12 text-[#d97706] font-black bg-black/40 px-8 py-3 rounded-2xl border border-[#d97706]/30 animate-pulse uppercase tracking-widest">Tvůj kód: {lastOrderCode}</div>}
          </div>
        )}

        {/* SLEDOVÁNÍ */}
        {view === 'status' && (
          <div className="max-w-2xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4">
            <button onClick={() => setView('home')} className="mb-6 text-[#d97706] font-bold uppercase tracking-widest hover:text-white transition-colors">← Zpět na úvod</button>
            <div className="bg-[#23110a] p-10 rounded-[3rem] border-2 border-white/5 text-center shadow-2xl">
              <h2 className="text-3xl font-black mb-10 uppercase tracking-tighter">Stav objednávky</h2>
              <input 
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="VLOŽTE KÓD (BM-XXXX)" 
                className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-6 text-2xl font-black outline-none focus:border-[#d97706] text-[#d97706] text-center mb-6 placeholder:text-white/5"
              />
              <button onClick={zkontrolovatStav} className="w-full py-6 rounded-2xl bg-[#d97706] text-[#23110a] font-black text-xl uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95">Prověřit kód</button>
              {orderStatus && (
                <div className="mt-12 p-10 bg-black/40 rounded-[2.5rem] border-t-4 border-[#d97706] shadow-inner">
                  <p className="text-xs font-black text-white/30 uppercase mb-3 tracking-[0.3em]">Aktuální status:</p>
                  <p className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-xl">{orderStatus}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MENU */}
        {view === 'order' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-500">
            <div className="lg:col-span-7">
               <button onClick={() => setView('home')} className="mb-8 text-[#d97706] font-bold uppercase tracking-widest hover:text-white transition-colors">← Zpět na úvod</button>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                 {MENU_ITEMS.map(item => (
                   <div key={item.id} className="group bg-white rounded-[3rem] p-10 flex flex-col items-center text-[#23110a] border-b-[8px] border-[#d97706] shadow-xl hover:scale-[1.02] transition-all">
                      <div className="w-20 h-20 bg-[#fdf8eb] rounded-full flex items-center justify-center text-4xl mb-4 border border-orange-100 group-hover:rotate-12 transition-transform">{item.icon}</div>
                      <h3 className="text-2xl font-black uppercase text-center leading-none tracking-tight">{item.name}</h3>
                      <p className="text-gray-400 text-[10px] text-center mt-3 mb-6 px-4 font-bold leading-tight">{item.desc}</p>
                      <button onClick={() => addToCart(item)} className="bg-[#23110a] text-[#d97706] font-black px-12 py-3 rounded-full hover:bg-black transition-all active:scale-95 shadow-md text-xl font-mono tracking-tighter">${item.price}</button>
                   </div>
                 ))}
               </div>
            </div>

            {/* KOŠÍK */}
            <div className="lg:col-span-5">
              <div className="bg-[#23110a] p-10 rounded-[4rem] border border-white/5 sticky top-10 shadow-2xl">
                <h2 className="text-3xl font-black mb-8 border-b border-white/10 pb-4 uppercase text-white tracking-tighter">Vaše objednávka</h2>
                <div className="space-y-6 mb-10 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                  {Object.entries(cart).length === 0 ? (
                    <p className="text-white/20 italic text-center py-10 uppercase font-black tracking-widest">Košík je prázdný</p>
                  ) : (
                    Object.entries(cart).map(([id, item]) => (
                      <div key={id} className="flex justify-between items-center group animate-in slide-in-from-right-4">
                        <div className="flex flex-col">
                          <span className="text-white font-black uppercase text-lg leading-tight tracking-tight mb-1">{item.name}</span>
                          <button onClick={() => removeOne(Number(id))} className="text-[#d97706] text-[10px] font-black uppercase text-left hover:text-red-500 transition-colors tracking-widest">[ ODEBRAT -1 ]</button>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center bg-black/40 rounded-xl px-3 py-1 border border-white/10">
                             <span className="text-[10px] font-black text-white/20 mr-2 uppercase">ks</span>
                             <input type="number" value={item.count} onChange={(e) => updateQuantity(Number(id), e.target.value)} className="bg-transparent w-10 text-center font-black text-[#d97706] text-xl outline-none" />
                          </div>
                          <span className="text-white font-mono font-bold text-xl tracking-tighter">${(item.price * item.count).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex justify-between items-center border-t-4 border-[#d97706] pt-8 mb-8 text-white">
                   <span className="text-2xl font-black uppercase tracking-tighter">Celkem</span>
                   <span className="text-5xl font-black text-[#d97706] tracking-tighter font-mono">${total.toLocaleString()}</span>
                </div>
                <div className="space-y-6">
                  <input 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                    placeholder="JMÉNO ZÁKAZNÍKA (MATEO REYES)" 
                    className="w-full bg-black/40 border-2 border-white/5 p-6 rounded-[1.5rem] font-black text-white outline-none focus:border-[#d97706] uppercase transition-all placeholder:text-white/10" 
                  />
                  <button 
                    onClick={potvrditObjednavku} 
                    disabled={!customerName || total === 0} 
                    className="w-full py-7 rounded-[2rem] bg-[#d97706] text-[#23110a] font-black text-2xl uppercase hover:bg-white shadow-[0_10px_40px_rgba(217,119,6,0.2)] transition-all disabled:opacity-10 active:scale-95"
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