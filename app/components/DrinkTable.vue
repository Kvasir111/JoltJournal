<script setup lang="ts">
import { Pencil, RotateCcw, Search, SlidersHorizontal } from '@lucide/vue'
import type { BuyAgain, Drink } from '~/types/drink'

defineProps<{
  drinks: Drink[]
  total: number
  query: string
  buyAgain: BuyAgain | 'all'
  sort: string
  editable: boolean
}>()

const emit = defineEmits<{
  edit: [drink: Drink]
  reset: []
  'update:query': [value: string]
  'update:buyAgain': [value: BuyAgain | 'all']
  'update:sort': [value: string]
}>()

const scoreTone = (rating: number) => {
  if (rating >= 8) return 'bg-acid text-white shadow-rune'
  if (rating >= 6) return 'border border-acid/50 bg-acid/10 text-violet'
  return 'bg-white/10 text-cream'
}
</script>

<template>
  <section id="drinks" class="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
    <div class="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <p class="tech-label mb-3 text-violet">Vault records // all entries</p>
        <h2 class="font-display text-4xl font-black uppercase tracking-tight sm:text-5xl">Flavor log</h2>
        <p class="mt-2 text-sm text-muted">Showing {{ drinks.length }} of {{ total }} rated drinks</p>
      </div>

      <div class="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto_auto]">
        <label class="relative block">
          <Search class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" :size="18" />
          <input :value="query" class="focus-ring cut-corners w-full border border-white/10 bg-panel py-3 pl-10 pr-4 text-sm text-cream placeholder:text-muted" placeholder="Search brand or flavor" type="search" @input="emit('update:query', ($event.target as HTMLInputElement).value)">
        </label>
        <label class="relative block">
          <SlidersHorizontal class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" :size="17" />
          <select :value="buyAgain" class="focus-ring cut-corners w-full appearance-none border border-white/10 bg-panel py-3 pl-10 pr-8 text-sm text-cream" aria-label="Filter by buy again" @change="emit('update:buyAgain', ($event.target as HTMLSelectElement).value as BuyAgain | 'all')">
            <option value="all">Any verdict</option><option value="yes">Would buy</option><option value="no">Wouldn't buy</option><option value="unknown">Not sure</option>
          </select>
        </label>
        <select :value="sort" class="focus-ring cut-corners w-full border border-white/10 bg-panel px-4 py-3 text-sm text-cream" aria-label="Sort drinks" @change="emit('update:sort', ($event.target as HTMLSelectElement).value)">
          <option value="rating-desc">Rating: high first</option><option value="rating-asc">Rating: low first</option><option value="brand">Brand: A–Z</option><option value="flavor">Flavor: A–Z</option>
        </select>
      </div>
    </div>

    <div v-if="drinks.length" class="cut-corners overflow-hidden border border-white/10 bg-panel shadow-lift">
      <div class="hidden gap-4 border-b border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-muted md:grid" :class="editable ? 'grid-cols-[1.1fr_1.5fr_110px_130px_44px]' : 'grid-cols-[1.1fr_1.5fr_110px_130px]'">
        <span>Brand</span><span>Flavor</span><span>Rating</span><span>Buy again</span><span v-if="editable" />
      </div>
      <button v-for="drink in drinks" :key="drink.id" class="focus-ring group grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-b border-white/5 px-4 py-4 text-left transition last:border-b-0 md:items-center md:px-5" :class="editable ? 'hover:bg-acid/[0.045] md:grid-cols-[1.1fr_1.5fr_110px_130px_44px]' : 'cursor-default md:grid-cols-[1.1fr_1.5fr_110px_130px]'" type="button" :disabled="!editable" @click="editable && emit('edit', drink)">
        <span class="font-bold text-cream">{{ drink.brand }}</span>
        <span class="col-start-1 text-sm text-muted md:col-auto md:text-cream">{{ drink.flavor }}</span>
        <span class="cut-corners row-span-2 row-start-1 justify-self-end px-2.5 py-1 font-mono text-xs font-extrabold md:row-auto md:justify-self-start" :class="scoreTone(drink.rating)">{{ drink.rating.toFixed(1) }}</span>
        <span class="w-fit rounded-full border px-2.5 py-1 text-xs font-bold" :class="drink.buyAgain === 'yes' ? 'border-acid/40 text-acid' : drink.buyAgain === 'no' ? 'border-white/10 text-muted' : 'border-violet/40 text-violet'">
          {{ drink.buyAgain === 'yes' ? 'Yes' : drink.buyAgain === 'no' ? 'No' : 'Not sure' }}
        </span>
        <Pencil v-if="editable" class="hidden text-muted transition group-hover:text-acid md:block" :size="17" />
      </button>
    </div>

    <div v-else class="cut-corners grid min-h-72 place-items-center border border-dashed border-acid/30 bg-panel/50 p-8 text-center">
      <div>
        <p class="text-xl font-bold text-cream">No cans match those filters.</p>
        <p class="mt-2 text-sm text-muted">Clear the filters and the stash should reappear.</p>
        <button class="focus-ring mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold hover:border-acid hover:text-acid" type="button" @click="emit('reset')"><RotateCcw :size="16" /> Clear filters</button>
      </div>
    </div>
  </section>
</template>
