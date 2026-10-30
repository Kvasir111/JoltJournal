<script setup lang="ts">
import { BookmarkPlus, Trash2, X, Zap } from '@lucide/vue'
import type { WishlistDraft, WishlistItem } from '~/types/drink'

defineProps<{
  open: boolean
  items: WishlistItem[]
  brands: string[]
  pending: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  close: []
  add: [draft: WishlistDraft]
  remove: [id: string]
  rate: [item: WishlistItem]
}>()

const form = reactive<WishlistDraft>({ brand: '', flavor: '' })
const canSubmit = computed(() => Boolean(form.brand.trim() && form.flavor.trim()))
const submit = () => {
  if (!canSubmit.value) return
  emit('add', { brand: form.brand.trim(), flavor: form.flavor.trim() })
  form.brand = ''
  form.flavor = ''
}
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="open" class="fixed inset-0 z-50 grid place-items-end bg-black/80 backdrop-blur-md sm:place-items-center sm:p-6" role="presentation" @click.self="emit('close')">
        <section class="cut-corners rune-frame flex max-h-[90vh] w-full flex-col border border-acid/40 bg-panel p-6 shadow-lift sm:max-w-2xl sm:p-8" role="dialog" aria-modal="true" aria-label="Wishlist">
          <div class="mb-6 flex items-start justify-between gap-4">
            <div><p class="tech-label mb-2 text-acid">Future raids</p><h2 class="font-display text-3xl font-black uppercase">The hunt list</h2></div>
            <button class="focus-ring cut-corners border border-white/10 p-2 text-muted hover:border-acid hover:text-acid" type="button" aria-label="Close wishlist" @click="emit('close')"><X :size="20" /></button>
          </div>

          <form class="grid gap-3 border-b border-white/10 pb-6 sm:grid-cols-[1fr_1.4fr_auto]" @submit.prevent="submit">
            <label><span class="mb-2 block text-sm font-semibold">Brand</span><input v-model="form.brand" list="wishlist-brands" class="focus-ring cut-corners w-full border border-white/10 bg-ink px-4 py-3 text-cream" placeholder="Brand" required><datalist id="wishlist-brands"><option v-for="brand in brands" :key="brand" :value="brand" /></datalist></label>
            <label><span class="mb-2 block text-sm font-semibold">Flavor</span><input v-model="form.flavor" class="focus-ring cut-corners w-full border border-white/10 bg-ink px-4 py-3 text-cream" placeholder="Flavor to find" required></label>
            <button class="focus-ring cut-corners self-end bg-acid px-4 py-3.5 font-mono text-xs font-extrabold uppercase text-white disabled:opacity-40" type="submit" :disabled="pending || !canSubmit"><BookmarkPlus :size="18" class="sm:hidden" /><span class="hidden sm:inline">Add target</span></button>
          </form>

          <p v-if="error" class="mt-4 font-mono text-xs text-red-200">{{ error }}</p>
          <div class="mt-5 min-h-0 space-y-2 overflow-y-auto pr-1">
            <article v-for="item in items" :key="item.id" class="grid grid-cols-[1fr_auto] items-center gap-4 border border-white/10 bg-ink/70 p-4 sm:grid-cols-[1fr_auto_auto]">
              <div><p class="font-display text-lg font-black uppercase text-cream">{{ item.brand }}</p><p class="text-sm text-muted">{{ item.flavor }}</p></div>
              <button class="focus-ring cut-corners inline-flex items-center gap-2 border border-acid/40 px-3 py-2 font-mono text-xs font-bold uppercase text-acid hover:bg-acid hover:text-white" type="button" @click="emit('rate', item)"><Zap :size="15" /> Tried it</button>
              <button class="focus-ring cut-corners border border-white/10 p-2.5 text-muted hover:border-red-400 hover:text-red-300" type="button" aria-label="Remove from wishlist" @click="emit('remove', item.id)"><Trash2 :size="16" /></button>
            </article>
            <div v-if="!items.length" class="border border-dashed border-white/10 px-5 py-10 text-center"><p class="font-display text-xl font-black uppercase">The hunt is empty</p><p class="mt-2 text-sm text-muted">Add a flavor you want to track down.</p></div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
