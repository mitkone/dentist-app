import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { dentist_id, dentist_name, patient_name, date, start, end, type, notes, patient_phone, patient_email } = body;

    if (!dentist_id || !patient_name || !date || !start) {
      return new Response(JSON.stringify({ error: 'Липсват задължителни полета' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('dentist_id', dentist_id)
      .maybeSingle();

    const toEmail = profile?.email;
    if (!toEmail) {
      return new Response(JSON.stringify({ ok: false, skipped: 'Няма имейл за този лекар' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('bg-BG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const subject = `Нов записан час: ${patient_name} – ${date} ${start}`;
    const html = `
      <h2>Записан е нов час за вас</h2>
      <p><strong>Пациент:</strong> ${patient_name}</p>
      <p><strong>Дата:</strong> ${dateFormatted}</p>
      <p><strong>Час:</strong> ${start} – ${end}</p>
      <p><strong>Вид преглед:</strong> ${type || '—'}</p>
      ${patient_phone ? `<p><strong>Телефон на пациента:</strong> ${patient_phone}</p>` : ''}
      ${patient_email ? `<p><strong>Имейл на пациента:</strong> ${patient_email}</p>` : ''}
      ${notes ? `<p><strong>Бележки:</strong> ${notes}</p>` : ''}
      <p style="margin-top:24px;color:#64748b;font-size:12px;">Хаджиев Дент — Система за запазване на часове</p>
    `;

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY не е конфигуриран' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject,
        html,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: result.message || result.detail || 'Грешка при изпращане' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
