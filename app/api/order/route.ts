import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // === TADY DOPOVĚZ SVÉ ÚDAJE ===
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxz4X7fpgMrrQfrxE5kGsP3Yy-taMcFjAFHXsGzO0w701G8G-rX_8ZJ8q2tpx-ByP2y/exec";
  const DISCORD_WEBHOOK_URL = "TVŮJ_SKUTEČNÝ_DISCORD_WEBHOOK_ZDE"; 

  try {
    const body = await request.json();

    // 1. Odeslání do Google Tabulky
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // 2. Odeslání na Discord
    if (DISCORD_WEBHOOK_URL.startsWith("http")) {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: "Bean Machine Bot",
          embeds: [{
            title: `☕ Nová objednávka: ${body.code}`,
            color: 14251782,
            fields: [
              { name: "Zákazník", value: body.customer, inline: true },
              { name: "Cena", value: `${body.price} B`, inline: true },
              { name: "Položky", value: body.items }
            ]
          }]
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chyba na serveru:", error);
    return NextResponse.json({ error: 'Něco se nepovedlo' }, { status: 500 });
  }
}