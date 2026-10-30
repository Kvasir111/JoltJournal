<script setup lang="ts">
import { X } from '@lucide/vue'
import type { Drink, DrinkDraft, WishlistDraft } from '~/types/drink'

const props = defineProps<{
  open: boolean
  drink?: Drink | null
  seed?: WishlistDraft | null
  brands: string[]
}>()

const emit = defineEmits<{
  close: []
  save: [draft: DrinkDraft]
  delete: []
}>()

const form = reactive<DrinkDraft>({ brand: '', flavor: '', rating: 5, buyAgain: 'unknown' })

watch(
  () => [props.open, props.drink, props.seed] as const,
  () => {
    if (!props.open) return
    form.brand = props.drink?.brand ?? props.seed?.brand ?? ''
    form.flavor = props.drink?.flavor ?? props.seed?.flavor ?? ''
    form.rating = props.drink?.rating ?? 5
    form.buyAgain = props.drink?.buyAgain ?? 'unknown'
  },
  { immediate: true }
)

const canSubmit = computed(() => {
  return Boolean(form.brand.trim() && form.flavor.trim() && form.rating >= 1 && form.rating <= 10)
})

const submit = () => {
  if (!canSubmit.value) return
  emit('save', {
    brand: form.brand.trim(),
    flavor: form.flavor.trim(),
    rating: Number(form.rating),
    buyAgain: form.buyAgain
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div
        v-if="open"
        class="fixed inset-0 z-50 grid place-items-end bg-black/80 p-0 backdrop-blur-md sm:place-items-center sm:p-6"
        role="presentation"
        @click.self="emit('close')"
      >
        <section
          class="cut-corners rune-frame w-full border border-acid/40 bg-panel p-6 shadow-lift sm:max-w-lg sm:p-8"
          role="dialog"
          aria-modal="true"
          :aria-label="drink ? 'Edit drink' : 'Add drink'"
        >
          <div class="mb-7 flex items-start justify-between gap-4">
            <div>
              <p class="tech-label mb-2 text-acid">{{ drink ? 'Revise the rune' : 'New saga entry' }}</p>
              <h2 class="font-display text-3xl font-black uppercase leading-none">{{ drink ? 'Edit drink' : 'Add a drink' }}</h2>
            </div>
            <button class="focus-ring cut-corners border border-white/10 p-2 text-muted hover:border-acid hover:text-acid" type="button" aria-label="Close" @click="emit('close')">
              <X :size="20" />
            </button>
          </div>

          <form class="space-y-5" @submit.prevent="submit">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-cream">Brand</span>
              <input v-model="form.brand" list="known-brands" class="focus-ring cut-corners w-full border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/60" placeholder="e.g. Monster" required>
              <datalist id="known-brands">
                <option v-for="brand in brands" :key="brand" :value="brand" />
              </datalist>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-cream">Flavor</span>
              <input v-model="form.flavor" class="focus-ring cut-corners w-full border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/60" placeholder="e.g. Ultra Paradise" required>
            </label>

            <label class="block">
              <span class="mb-2 flex items-center justify-between text-sm font-semibold text-cream">
                <span>Rating</span>
                <span class="cut-corners bg-acid px-3 py-1 font-mono text-sm font-extrabold text-white">{{ form.rating }}/10</span>
              </span>
              <input v-model.number="form.rating" class="focus-ring h-2 w-full cursor-pointer accent-[#d9ff57]" type="range" min="1" max="10" step="0.5">
              <span class="mt-2 flex justify-between text-xs text-muted"><span>Rough</span><span>Perfect</span></span>
            </label>

            <fieldset>
              <legend class="mb-2 text-sm font-semibold text-cream">Would you buy it again?</legend>
              <div class="grid grid-cols-3 gap-2">
                <label
                  v-for="option in [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'Not sure' }]"
                  :key="option.value"
                  :class="['cut-corners cursor-pointer border px-3 py-3 text-center font-mono text-xs font-bold uppercase tracking-wide transition focus-within:ring-2 focus-within:ring-acid', form.buyAgain === option.value ? 'border-acid bg-acid text-white' : 'border-white/10 bg-ink text-muted hover:border-acid/50 hover:text-cream']"
                >
                  <input v-model="form.buyAgain" class="sr-only" type="radio" :value="option.value">
                  {{ option.label }}
                </label>
              </div>
            </fieldset>

            <div class="flex items-center gap-3 pt-2">
              <button v-if="drink" class="focus-ring cut-corners px-4 py-3 font-mono text-xs font-bold uppercase text-red-300 hover:bg-red-400/10" type="button" @click="emit('delete')">Delete</button>
              <button class="focus-ring cut-corners flex-1 bg-acid px-5 py-3.5 font-mono text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-ember disabled:cursor-not-allowed disabled:opacity-40" type="submit" :disabled="!canSubmit">
                {{ drink ? 'Save changes' : 'Add to the log' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
