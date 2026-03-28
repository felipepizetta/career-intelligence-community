import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Delete ALL posts for the logged-in user
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('user_id', user.id)

        if (error) {
            console.error('Supabase clear history error:', error)
            return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in CLEAR history route:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
