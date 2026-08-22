import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Disparada por um Cron Trigger do Supabase (Dashboard → Edge Functions →
// esta função → Cron), não por um usuário logado — por isso a autenticação
// é feita comparando o Bearer token com o próprio service role key, em vez
// do fluxo normal de JWT de usuário usado em send-push-notification.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const INACTIVE_DAYS = 3;
const EXPO_BATCH_SIZE = 100;

type ReminderTarget = {
  user_id: string;
  expo_push_token: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: targets, error } = await adminClient.rpc('get_training_reminder_targets', {
      p_inactive_days: INACTIVE_DAYS,
    });

    if (error) {
      throw error;
    }

    const rows = (targets ?? []) as ReminderTarget[];

    if (rows.length === 0) {
      return new Response(JSON.stringify({ ok: true, notified: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messages = rows.map((row) => ({
      to: row.expo_push_token,
      sound: 'default',
      title: 'Treino te esperando 💪',
      body: `Já faz ${INACTIVE_DAYS}+ dias sem treinar. Bora hoje?`,
      data: { type: 'training_reminder', screen: 'workouts' },
    }));

    const batches = chunk(messages, EXPO_BATCH_SIZE);
    const results = [];
    for (const batch of batches) {
      const expoResponse = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });
      results.push(await expoResponse.json());
    }

    return new Response(JSON.stringify({ ok: true, notified: rows.length, expo: results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('training-reminder-cron failed', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
