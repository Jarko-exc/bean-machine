import { NextResponse } from 'next/server';

export async function GET() {
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxz4X7fpgMrrQfrxE5kGsP3Yy-taMcFjAFHXsGzO0w701G8G-rX_8ZJ8q2tpx-ByP2y/exec";
  
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, { 
        cache: 'no-store',
        method: 'GET',
        redirect: 'follow'
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}