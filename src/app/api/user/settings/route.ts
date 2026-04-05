import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({

        gemini_api_key: user.user_metadata?.gemini_api_key || '',
        user_context: user.user_metadata?.user_context || ''
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
        const { gemini_api_key, user_context } = body

        const { data, error } = await supabase.auth.updateUser({
            data: {

                gemini_api_key: gemini_api_key,
                user_context: user_context
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
