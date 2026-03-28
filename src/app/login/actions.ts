'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// 1. Define Zod Schemas for robust validation
const authSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // 2. Validate input
    const validation = authSchema.safeParse({ email, password })
    if (!validation.success) {
        const errorMsg = validation.error.issues[0].message
        redirect(`/login?message=${encodeURIComponent(errorMsg)}`)
    }

    const supabase = await createClient()

    // 3. Attempt Sign In
    const { error } = await supabase.auth.signInWithPassword(validation.data)

    if (error) {
        // Return the specific Supabase error message (e.g., "Invalid login credentials")
        redirect(`/login?message=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // 2. Validate input
    const validation = authSchema.safeParse({ email, password })
    if (!validation.success) {
        const errorMsg = validation.error.issues[0].message
        redirect(`/login?message=${encodeURIComponent(errorMsg)}`)
    }

    const supabase = await createClient()

    // 3. Attempt Sign Up
    const { error } = await supabase.auth.signUp(validation.data)

    if (error) {
        // Return the specific Supabase error message (e.g., "User already registered")
        redirect(`/login?message=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
