import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxz4X7fpgMrrQfrxE5kGsP3Yy-taMcFjAFHXsGzO0w701G8G-rX_8ZJ8q2tpx-ByP2y/exec";
  const DISCORD_WEBHOOK_URL = "SEM_DEJ_SVŮJ_LINK_Z_DISCORDU"; 

  try {
    const body = await request.json();

    // 1. ZÁPIS DO GOOGLE TABULKY
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // 2. ODESLÁNÍ NA DISCORD
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
    return NextResponse.json({ success: false }, { status: 500 });
  }
}