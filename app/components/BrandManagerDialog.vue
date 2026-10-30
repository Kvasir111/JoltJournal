<script setup lang="ts">
import { Merge, X } from '@lucide/vue'

interface BrandOption { id: number, name: string, count: number }

const props = defineProps<{
  open: boolean
  brands: BrandOption[]
  pending: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  close: []
  merge: [sourceBrandId: number, targetName: string]
}>()

const sourceBrandId = ref<number | null>(null)
const targetName = ref('')
const canSubmit = computed(() => Boolean(sourceBrandId.value && targetName.value.trim()))

watch(() => props.open, (open) => {
  if (!open) return
  sourceBrandId.value = null
  targetName.value = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="open" class="fixed inset-0 z-50 grid place-items-end bg-black/80 backdrop-blur-md sm:place-items-center sm:p-6" role="presentation" @click.self="emit('close')">
        <section class="cut-corners rune-frame w-full border border-acid/40 bg-panel p-6 shadow-lift sm:max-w-lg sm:p-8" role="dialog" aria-modal="true" aria-label="Manage brands">
          <div class="mb-7 flex items-start justify-between gap-4">
            <div><p class="tech-label mb-2 text-acid">Canonical clans</p><h2 class="font-display text-3xl font-black uppercase">Merge a brand</h2></div>
            <button class="focus-ring cut-corners border border-white/10 p-2 text-muted hover:border-acid hover:text-acid" type="button" aria-label="Close brand manager" @click="emit('close')"><X :size="20" /></button>
          </div>
          <p class="mb-6 text-sm leading-relaxed text-muted">Move every one of your ratings and wishlist entries from a misspelled or duplicate brand into one canonical name. Your ratings are not changed.</p>
          <form class="space-y-5" @submit.prevent="sourceBrandId && emit('merge', sourceBrandId, targetName.trim())">
            <label class="block"><span class="mb-2 block text-sm font-semibold">Brand to replace</span><select v-model="sourceBrandId" class="focus-ring cut-corners w-full border border-white/10 bg-ink px-4 py-3 text-cream" required><option :value="null" disabled>Select a brand</option><option v-for="brand in brands" :key="brand.id" :value="brand.id">{{ brand.name }} · {{ brand.count }} item{{ brand.count === 1 ? '' : 's' }}</option></select></label>
            <label class="block"><span class="mb-2 block text-sm font-semibold">Canonical brand name</span><input v-model="targetName" list="canonical-brand-names" class="focus-ring cut-corners w-full border border-white/10 bg-ink px-4 py-3 text-cream" placeholder="e.g. Celsius" required><datalist id="canonical-brand-names"><option v-for="brand in brands" :key="brand.id" :value="brand.name" /></datalist></label>
            <p v-if="error" class="font-mono text-xs text-red-200">{{ error }}</p>
            <button class="focus-ring cut-corners inline-flex w-full items-center justify-center gap-2 bg-acid px-5 py-3.5 font-mono text-xs font-extrabold uppercase tracking-wider text-white disabled:opacity-40" type="submit" :disabled="pending || !canSubmit"><Merge :size="17" /> {{ pending ? 'Merging…' : 'Merge collection' }}</button>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
