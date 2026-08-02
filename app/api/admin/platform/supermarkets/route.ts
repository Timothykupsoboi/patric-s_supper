import { NextResponse } from 'next/server';
import { createServerClient as createAdminClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nombvcgcklptugiiwrvu.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWJ2Y2dja2xwdHVnaWl3cnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzc5NTgsImV4cCI6MjA5ODkxMzk1OH0.Z-dYIsDmDsh1djdbgOfMr2jiYYu515smBBKxgbFFRPw';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // 1. Authenticate caller session via cookies
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    // 2. Perform server-side multi-tenant provisioning using Service Role client
    const supabaseAdmin = createAdminClient();

    const supermarketId = crypto.randomUUID();
    const branchId = crypto.randomUUID();
    const ownerUserId = crypto.randomUUID();
    const licenseKey = `LIC-PATRICK-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;

    // A. Create Supermarket Record
    const { data: supermarket, error: smError } = await supabaseAdmin
      .from('supermarkets')
      .insert([
        {
          id: supermarketId,
          name: payload.name,
          subscription_plan: payload.subscription_plan || 'starter',
          subscription_status: 'active',
          max_branches: payload.subscription_plan === 'enterprise' ? 999 : payload.subscription_plan === 'professional' ? 10 : 2,
          license_key: licenseKey,
          logo_url: payload.logo_url,
          address: payload.business_address,
          phone: payload.owner_phone,
          email: payload.owner_email,
        },
      ])
      .select()
      .single();

    if (smError || !supermarket) {
      console.error('Error creating supermarket tenant:', smError);
      return NextResponse.json(
        { error: smError?.message || 'Failed to create supermarket record' },
        { status: 400 }
      );
    }

    // B. Create Default Branch
    const { data: branch, error: branchError } = await supabaseAdmin
      .from('branches')
      .insert([
        {
          id: branchId,
          supermarket_id: supermarket.id,
          name: payload.default_branch_name || 'Main Branch',
          location: payload.business_address || 'HQ',
        },
      ])
      .select()
      .single();

    if (branchError || !branch) {
      console.error('Error creating default branch:', branchError);
      return NextResponse.json(
        { error: branchError?.message || 'Failed to create default branch' },
        { status: 400 }
      );
    }

    // C. Create Owner User in Supabase Auth & Users table
    let finalOwnerId = crypto.randomUUID();
    if (payload.owner_email && payload.password) {
      const { data: authUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
        email: payload.owner_email,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          name: payload.owner_name,
        },
      });

      if (authCreateError) {
        console.warn('Supabase Auth createUser notice:', authCreateError.message);
      } else if (authUser?.user) {
        finalOwnerId = authUser.user.id;
      }
    }

    const { error: userError } = await supabaseAdmin.from('users').insert([
      {
        id: finalOwnerId,
        supermarket_id: supermarket.id,
        branch_id: branch.id,
        name: payload.owner_name,
        email: payload.owner_email,
        phone: payload.owner_phone,
        role: 'super_admin',
        is_active: true,
      },
    ]);

    if (userError) {
      console.warn('Warning creating user record in public.users:', userError.message);
    }

    // D. Record Audit Log
    await supabaseAdmin.from('audit_logs').insert([
      {
        supermarket_id: supermarket.id,
        user_id: user?.id || ownerUserId,
        action: `Supermarket Tenant Created: ${payload.name} (Owner: ${payload.owner_email})`,
        table_name: 'supermarkets',
        record_id: supermarket.id,
      },
    ]);

    return NextResponse.json({
      success: true,
      supermarket: {
        ...supermarket,
        owner_name: payload.owner_name,
        owner_email: payload.owner_email,
        owner_phone: payload.owner_phone,
        country: payload.country,
        currency: payload.currency,
        timezone: payload.timezone,
        business_address: payload.business_address,
        registration_number: payload.registration_number,
      },
    });
  } catch (error: any) {
    console.error('Unexpected error in POST /api/admin/platform/supermarkets:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
