import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { requireAdmin, errJson, okJson } from '@/lib/admin-auth';


export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);

  const { campaignId } = await req.json();
  if (!campaignId) return errJson('campaignId required');

  const supabase = createAdminSupabaseClient();

  // Get campaign
  const { data: campaign } = await supabase
    .from('email_campaigns').select('*').eq('id', campaignId).single();
  if (!campaign) return errJson('Campaign not found');
  if (campaign.status === 'sent') return errJson('Campaign already sent');

  // Get subscribers
  const { data: subscribers } = await supabase
    .from('newsletter_subscribers').select('email, name').eq('is_active', true);
  if (!subscribers?.length) return errJson('No active subscribers');

  // Send in batches of 50
  const BATCH_SIZE = 50;
  let sentCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    try {
      const result = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify(
          batch.map((sub: any) => ({
            from: 'KDSL Clothing <noreply@kdslclothing.com>',
            to: sub.email,
            subject: campaign.subject,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">${campaign.body}<hr style="margin:32px 0;border:none;border-top:1px solid #eee"/><p style="font-size:12px;color:#888">You\'re receiving this because you subscribed to KDSL Clothing updates.</p></div>`,
          }))
        ),
      });
      if (result.ok) sentCount += batch.length;
    } catch (err: any) {
      errors.push(err.message);
    }
  }

  // Update campaign status
  await supabase.from('email_campaigns').update({
    status: 'sent',
    sent_count: sentCount,
    sent_at: new Date().toISOString(),
  }).eq('id', campaignId);

  await supabase.from('admin_activity_log').insert({
    admin_id: admin.adminId, action: 'send_campaign',
    entity: 'email_campaign', entity_id: campaignId,
    details: { sentCount, errors },
  });

  return okJson({ success: true, sentCount, errors });
}
