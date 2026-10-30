<script setup lang="ts">
import { KeyRound, Mail, ShieldCheck } from '@lucide/vue'

defineProps<{
  pending: boolean
  error?: string | null
  notice?: string | null
}>()

const emit = defineEmits<{
  signIn: [email: string, password: string]
  signUp: [email: string, password: string]
}>()

const mode = ref<'sign-in' | 'sign-up'>('sign-in')
const email = ref('')
const password = ref('')
const canSubmit = computed(() => email.value.includes('@') && password.value.length >= 8)

const submit = () => {
  if (!canSubmit.value) return
  const credentials = [email.value.trim(), password.value] as const
  if (mode.value === 'sign-in') emit('signIn', ...credentials)
  else emit('signUp', ...credentials)
}
</script>

<template>
  <main id="top" class="red-grid relative grid min-h-[calc(100vh-5rem)] place-items-center overflow-hidden px-4 py-16 sm:px-6">
    <div class="rune-sigil pointer-events-none absolute -right-8 top-4 select-none text-[22rem] font-black leading-none text-acid/[0.07] sm:right-12 sm:text-[34rem]">ᛉ</div>
    <section class="rune-frame cut-corners relative w-full max-w-md border border-acid/30 bg-panel/95 p-6 shadow-lift sm:p-9" aria-labelledby="auth-title">
      <div class="mb-8 flex items-start gap-4">
        <span class="cut-corners grid h-12 w-12 shrink-0 place-items-center border border-acid bg-acid/10 text-acid shadow-rune">
          <ShieldCheck :size="25" />
        </span>
        <div>
          <p class="tech-label mb-2 text-acid">Vault clearance</p>
          <h1 id="auth-title" class="font-display text-3xl font-black uppercase leading-none">{{ mode === 'sign-in' ? 'Enter the hall' : 'Forge an account' }}</h1>
        </div>
      </div>

      <p class="mb-7 text-sm leading-relaxed text-steel">Your saga is sealed to your Supabase account. Only you can read or alter its drink runes.</p>

      <div class="mb-6 grid grid-cols-2 border border-white/10 bg-ink p-1">
        <button class="focus-ring px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider" :class="mode === 'sign-in' ? 'bg-acid text-white' : 'text-muted hover:text-cream'" type="button" @click="mode = 'sign-in'">Sign in</button>
        <button class="focus-ring px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider" :class="mode === 'sign-up' ? 'bg-acid text-white' : 'text-muted hover:text-cream'" type="button" @click="mode = 'sign-up'">Create account</button>
      </div>

      <div v-if="error" class="mb-5 border-l-2 border-red-400 bg-red-950/60 px-4 py-3 font-mono text-xs text-red-100" role="alert">{{ error }}</div>
      <div v-if="notice" class="mb-5 border-l-2 border-violet bg-violet/10 px-4 py-3 font-mono text-xs text-cream" role="status">{{ notice }}</div>

      <form class="space-y-5" @submit.prevent="submit">
        <label class="block">
          <span class="mb-2 block text-sm font-semibold text-cream">Email</span>
          <span class="relative block">
            <Mail class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" :size="18" />
            <input v-model="email" class="focus-ring cut-corners w-full border border-white/10 bg-ink py-3 pl-11 pr-4 text-cream placeholder:text-muted/60" type="email" autocomplete="email" placeholder="you@example.com" required>
          </span>
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-semibold text-cream">Password</span>
          <span class="relative block">
            <KeyRound class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" :size="18" />
            <input v-model="password" class="focus-ring cut-corners w-full border border-white/10 bg-ink py-3 pl-11 pr-4 text-cream placeholder:text-muted/60" type="password" :autocomplete="mode === 'sign-in' ? 'current-password' : 'new-password'" placeholder="At least 8 characters" minlength="8" required>
          </span>
        </label>
        <button class="focus-ring cut-corners w-full bg-acid px-5 py-3.5 font-mono text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-ember disabled:cursor-wait disabled:opacity-50" type="submit" :disabled="pending || !canSubmit">
          {{ pending ? 'Contacting the vault…' : mode === 'sign-in' ? 'Sign in' : 'Create account' }}
        </button>
      </form>
    </section>
  </main>
</template>
