import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Initialization moved inside POST handler to prevent build/evaluation crashes

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

        // 2. Parse payload for the pairing code
        const body = await request.json()
        const { code } = body

        if (!code || code.length < 5) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
        }

        // 3. Fetch recent messages from Telegram Bot
        const token = process.env.TELEGRAM_BOT_TOKEN
        if (!token || token === 'mock_token' || token === 'your_bot_token_here') {
            return NextResponse.json({ error: 'Telegram bot not configured. Add TELEGRAM_BOT_TOKEN to .env.local' }, { status: 500 })
        }

        // CRAZY IMPORTANT: If a webhook was previously set by any test, getUpdates will ALWAYS return empty array!
        // We MUST delete any existing webhook to allow polling.
        await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`)

        // Now we fetch the last 100 messages the bot received
        const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100`, { cache: 'no-store' })
        const data = await response.json()

        if (!data.ok) {
            console.error('[TELEGRAM GET UPDATES ERROR]', data)
            return NextResponse.json({ error: 'Failed to communicate with Telegram' }, { status: 500 })
        }

        // 4. Look for the message containing the user's specific pairing code
        const updates = data.result || []
        let foundChatId = null

        for (const update of updates) {
            // We look across all message types (if text exists)
            const text = update.message?.text || update.edited_message?.text
            if (text && text.trim() === code.trim()) {
                foundChatId = update.message?.chat?.id || update.edited_message?.chat?.id
                break
            }
        }

        if (!foundChatId) {
            return NextResponse.json({
                error: 'Code not found. Make sure you sent it to the bot recently.',
                found: false
            }, { status: 404 })
        }

        // 5. Update the User's Metadata with the Chat ID
        console.log(`[TELEGRAM VERIFY] Found code ${code}, linking chat ${foundChatId} to user ${user.id}`)

        const { error: updateError } = await supabase.auth.updateUser({
            data: { telegram_chat_id: foundChatId }
        })

        if (updateError) {
            console.error('[TELEGRAM VERIFY] Error updating user metadata:', updateError)
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        // Send a success message back via Telegram so the user knows it worked
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: foundChatId,
                text: "✅ Conta vinculada com sucesso na Career Intelligence Platform!",
            })
        })

        return NextResponse.json({ success: true, chat_id: foundChatId })

    } catch (error: any) {
        console.error('[TELEGRAM VERIFY FATAL ERROR]:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
