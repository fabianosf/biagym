import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type NotificationType =
  | 'training_reminder'
  | 'new_program'
  | 'new_lesson'
  | 'coach_message'
  | 'app_update'
  | 'test';

type SendPushBody = {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'training_reminder',
  'new_program',
  'new_lesson',
  'coach_message',
  'app_update',
  'test',
];
const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 500;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function isValidPayload(body: unknown): body is SendPushBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const b = body as Record<string, unknown>;

  return (
    typeof b.userId === 'string' && b.userId.length > 0 &&
    typeof b.title === 'string' && b.title.length > 0 && b.title.length <= MAX_TITLE_LENGTH &&
    typeof b.body === 'string' && b.body.length > 0 && b.body.length <= MAX_BODY_LENGTH &&
    typeof b.type === 'string' && (NOTIFICATION_TYPES as readonly string[]).includes(b.type)
  );
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidPayload(rawBody)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userId, title, body: messageBody, type, data = {} } = rawBody;

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isSelf = user.id === userId;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin';

    if (!isSelf && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: targetProfile, error: targetError } = await adminClient
      .from('profiles')
      .select('expo_push_token, push_notifications_enabled')
      .eq('id', userId)
      .maybeSingle();

    if (targetError || !targetProfile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!targetProfile.push_notifications_enabled || !targetProfile.expo_push_token) {
      return new Response(
        JSON.stringify({ error: 'Push notifications disabled for user' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const expoResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: targetProfile.expo_push_token,
        sound: 'default',
        title,
        body: messageBody,
        data: {
          ...data,
          type,
        },
      }),
    });

    const expoResult = await expoResponse.json();

    return new Response(JSON.stringify({ ok: true, expo: expoResult }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-push-notification failed', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
