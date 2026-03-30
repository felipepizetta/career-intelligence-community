import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Zod Security Schema
const autoSchema = z.object({
    is_active: z.boolean().default(false),
    news_source: z.string().max(8000, "URL base está muito longa. Rejeitado pelo Firewall.").trim(),
    post_style: z.string().max(100).default('auto'),
    schedule_days: z.string().regex(/^[0-6,]+$/, "Formato de dias inválido.").default('1,2,3,4,5'),
    posts_per_day: z.number().int().min(1).max(10).default(1)
})

// Rate Limiter
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 config saves per minute
        analytics: true,
    });
}

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('user_automations')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('[AUTOMATIONS GET] Error:', error)
            return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 })
        }

        return NextResponse.json({ success: true, automation: data || null })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Zod Parsing
        let body;
        try {
            const rawBody = await request.json()
            body = autoSchema.parse(rawBody)
        } catch (zodError: any) {
            return NextResponse.json({ error: 'Payload de Automação violou as regras de segurança', details: zodError.errors }, { status: 400 })
        }
        
        const { is_active, news_source, post_style, schedule_days, posts_per_day } = body

        // Rate Limiting Check
        if (ratelimit) {
            const { success } = await ratelimit.limit(user.id)
            if (!success) {
                return NextResponse.json({ error: 'Muitas tentativas de salvamento. Tente novamente em 1 minuto.' }, { status: 429 })
            }
        }

        // Upsert logically
        const { error } = await supabase
            .from('user_automations')
            .upsert({
                user_id: user.id,
                is_active,
                news_source,
                post_style,
                schedule_days: schedule_days || '1,2,3,4,5',
                posts_per_day: posts_per_day || 1,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })

        if (error) {
            console.error('[AUTOMATIONS UPSERT] Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
