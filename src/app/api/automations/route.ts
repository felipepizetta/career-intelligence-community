import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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

        const body = await request.json()
        const { is_active, news_source, post_style, frequency_days } = body

        // Upsert logically
        const { error } = await supabase
            .from('user_automations')
            .upsert({
                user_id: user.id,
                is_active,
                news_source,
                post_style,
                frequency_days,
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
