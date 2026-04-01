import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxz4X7fpgMrrQfrxE5kGsP3Yy-taMcFjAFHXsGzO0w701G8G-rX_8ZJ8q2tpx-ByP2y/exec"; // Sem dej ten stejný odkaz jako u statusu
  const DISCORD_WEBHOOK_URL = "TVŮJ_DISCORD_WEBHOOK_ZDE"; // Sem dej link z Discordu

  try {
    const body = await request.json();

    // 1. ZÁPIS DO GOOGLE TABULKY
    const googleRes = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // 2.ODESLÁNÍ NA DISCORD (Bonus - bude to chodit spolehlivě ze serveru)
    if (DISCORD_WEBHOOK_URL.startsWith("http")) {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `☕ **Nová objednávka!**\n**Kód:** ${body.code}\n**Zákazník:** ${body.customer}\n**Položky:** ${body.items}\n**Cena:** ${body.price} B`
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chyba objednávky:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}