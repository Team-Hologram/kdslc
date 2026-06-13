import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
    }

    const { error } = await supabase.from('contact_submissions').insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject?.trim() ?? '',
      message: message.trim(),
    });

    if (error) throw error;
    return NextResponse.json({ message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Contact POST error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
