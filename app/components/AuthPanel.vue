<script setup lang="ts">
import { KeyRound, Mail, ShieldCheck, X } from '@lucide/vue'

defineProps<{
  pending: boolean
  error?: string | null
  notice?: string | null
}>()

const emit = defineEmits<{
  signIn: [email: string, password: string]
  close: []
}>()

const email = ref('')
const password = ref('')
const canSubmit = computed(() => email.value.includes('@') && password.value.length >= 8)

const submit = () => {
  if (!canSubmit.value) return
  const credentials = [email.value.trim(), password.value] as const
  emit('signIn', ...credentials)
}
</script>

<template>
  <div class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/85 px-4 py-10 backdrop-blur-sm" role="presentation" @click.self="emit('close')">
    <section class="rune-frame cut-corners relative w-full max-w-md border border-acid/30 bg-panel p-6 shadow-lift sm:p-9" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button class="focus-ring absolute right-4 top-4 rounded-lg p-2 text-muted hover:text-cream" type="button" aria-label="Close owner sign in" @click="emit('close')"><X :size="19" /></button>
      <div class="mb-8 flex items-start gap-4">
        <span class="cut-corners grid h-12 w-12 shrink-0 place-items-center border border-acid bg-acid/10 text-acid shadow-rune">
          <ShieldCheck :size="25" />
        </span>
        <div>
          <p class="tech-label mb-2 text-acid">Curator clearance</p>
          <h1 id="auth-title" class="font-display text-3xl font-black uppercase leading-none">Enter the hall</h1>
        </div>
      </div>

      <p class="mb-7 text-sm leading-relaxed text-steel">The archive is public. Sign in with the curator account to add, edit, or remove drink runes.</p>

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
            <input v-model="password" class="focus-ring cut-corners w-full border border-white/10 bg-ink py-3 pl-11 pr-4 text-cream placeholder:text-muted/60" type="password" autocomplete="current-password" placeholder="At least 8 characters" minlength="8" required>
          </span>
        </label>
        <button class="focus-ring cut-corners w-full bg-acid px-5 py-3.5 font-mono text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-ember disabled:cursor-wait disabled:opacity-50" type="submit" :disabled="pending || !canSubmit">
          {{ pending ? 'Contacting the vault…' : 'Sign in' }}
        </button>
      </form>
    </section>
  </div>
</template>
