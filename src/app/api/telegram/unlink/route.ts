import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // 1. Verify Authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Remove telegram_chat_id from user_metadata usando a sessão do usuário
        const { error: updateError } = await supabase.auth.updateUser({
            data: { telegram_chat_id: null }
        })

        if (updateError) {
            console.error('[TELEGRAM UNLINK] Error updating user metadata:', updateError)
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('[TELEGRAM UNLINK FATAL ERROR]:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
