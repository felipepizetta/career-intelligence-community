import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    try {
        const { postId } = await request.json()

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Delete the post ensuring it belongs to the logged-in user
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', user.id)

        if (error) {
            console.error('Supabase deletion error:', error)
            return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in DELETE history route:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
