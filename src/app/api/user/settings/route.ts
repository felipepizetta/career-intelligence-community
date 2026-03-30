import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
        openai_api_key: user.user_metadata?.openai_api_key || '',
        gemini_api_key: user.user_metadata?.gemini_api_key || ''
    })
}

export async function POST(request: Request) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { openai_api_key, gemini_api_key } = body

        const { data, error } = await supabase.auth.updateUser({
            data: {
                openai_api_key: openai_api_key,
                gemini_api_key: gemini_api_key
            }
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
