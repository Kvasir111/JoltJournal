<script setup lang="ts">
import { ArrowDown, Bookmark, LoaderCircle, LogIn, LogOut, Plus, RotateCcw, Shield, Sparkles, Tags, Trophy, UserRound } from '@lucide/vue'
import type { BuyAgain, Drink, DrinkDraft, WishlistDraft, WishlistItem } from '~/types/drink'

const { user, ready: authReady, pending: authPending, error: authError, notice: authNotice, initialize, signIn, signOut } = useAuth()
const { drinks, pending, error, hydrate, addDrink, updateDrink, deleteDrink } = useDrinks()
const { items: wishlist, pending: wishlistPending, error: wishlistError, hydrate: hydrateWishlist, add: addWishlistItem, remove: removeWishlistItem, clear: clearWishlist } = useWishlist()
const { pending: brandPending, error: brandError, merge: mergeBrand } = useBrands()
const dialogOpen = ref(false)
const wishlistOpen = ref(false)
const brandManagerOpen = ref(false)
const authOpen = ref(false)
const editingDrink = ref<Drink | null>(null)
const newDrinkSeed = ref<WishlistDraft | null>(null)
const convertingWishlistId = ref<string | null>(null)
const query = ref('')
const selectedBrand = ref('all')
const buyAgainFilter = ref<BuyAgain | 'all'>('all')
const sort = ref('rating-desc')
const minimumLeaderboardDrinks = 4
const otherBrandLabel = 'Other'

onMounted(() => {
  Promise.allSettled([initialize(), hydrate()])
})

watch(
  () => user.value?.id,
  async (userId, previousUserId) => {
    if (userId === previousUserId) return
    clearWishlist()
    dialogOpen.value = false
    wishlistOpen.value = false
    brandManagerOpen.value = false
    editingDrink.value = null
    if (userId) await hydrateWishlist().catch(() => undefined)
  }
)

const brandGroups = computed(() => {
  const groups = new Map<string, Drink[]>()
  for (const drink of drinks.value) {
    const group = groups.get(drink.brand) ?? []
    group.push(drink)
    groups.set(drink.brand, group)
  }
  return groups
})

const summarizeBrand = (brand: string, brandDrinks: Drink[], groupedBrands = 0) => ({
  brand,
  count: brandDrinks.length,
  average: brandDrinks.reduce((sum, drink) => sum + drink.rating, 0) / brandDrinks.length,
  drinkability: Math.round((brandDrinks.filter((drink) => drink.buyAgain === 'yes').length / brandDrinks.length) * 100),
  groupedBrands
})

const brandStats = computed(() => {
  const ranked = []
  const otherDrinks: Drink[] = []
  let otherBrands = 0

  for (const [brand, brandDrinks] of brandGroups.value) {
    if (brandDrinks.length < minimumLeaderboardDrinks) {
      otherDrinks.push(...brandDrinks)
      otherBrands += 1
    } else {
      ranked.push(summarizeBrand(brand, brandDrinks))
    }
  }

  ranked.sort((a, b) => b.average - a.average)
  if (otherDrinks.length) ranked.push(summarizeBrand(otherBrandLabel, otherDrinks, otherBrands))
  return ranked
})

const brands = computed(() => [...new Set([
  ...brandGroups.value.keys(),
  ...wishlist.value.map(item => item.brand)
])].sort())
const brandOptions = computed(() => {
  const options = new Map<number, { id: number, name: string, count: number }>()
  for (const drink of drinks.value) {
    const option = options.get(drink.brandId) ?? { id: drink.brandId, name: drink.brand, count: 0 }
    option.count += 1
    options.set(drink.brandId, option)
  }
  for (const item of wishlist.value) {
    const option = options.get(item.brandId) ?? { id: item.brandId, name: item.brand, count: 0 }
    option.count += 1
    options.set(item.brandId, option)
  }
  return [...options.values()].sort((a, b) => a.name.localeCompare(b.name))
})
const averageRating = computed(() => drinks.value.length ? drinks.value.reduce((sum, drink) => sum + drink.rating, 0) / drinks.value.length : 0)
const buyAgainRate = computed(() => drinks.value.length ? Math.round((drinks.value.filter((drink) => drink.buyAgain === 'yes').length / drinks.value.length) * 100) : 0)
const topBrand = computed(() => brandStats.value[0])

const filteredDrinks = computed(() => {
  const needle = query.value.trim().toLowerCase()
  const result = drinks.value.filter((drink) => {
    const matchesSearch = !needle || `${drink.brand} ${drink.flavor}`.toLowerCase().includes(needle)
    const matchesBrand = selectedBrand.value === 'all'
      || (selectedBrand.value === otherBrandLabel
        ? (brandGroups.value.get(drink.brand)?.length ?? 0) < minimumLeaderboardDrinks
        : drink.brand === selectedBrand.value)
    const matchesBuyAgain = buyAgainFilter.value === 'all' || drink.buyAgain === buyAgainFilter.value
    return matchesSearch && matchesBrand && matchesBuyAgain
  })
  return [...result].sort((a, b) => {
    if (sort.value === 'rating-asc') return a.rating - b.rating
    if (sort.value === 'brand') return a.brand.localeCompare(b.brand) || b.rating - a.rating
    if (sort.value === 'flavor') return a.flavor.localeCompare(b.flavor)
    return b.rating - a.rating
  })
})

const openNew = () => { editingDrink.value = null; newDrinkSeed.value = null; convertingWishlistId.value = null; dialogOpen.value = true }
const openEdit = (drink: Drink) => { editingDrink.value = drink; newDrinkSeed.value = null; convertingWishlistId.value = null; dialogOpen.value = true }
const rateWishlistItem = (item: WishlistItem) => {
  wishlistOpen.value = false
  editingDrink.value = null
  newDrinkSeed.value = { brand: item.brand, flavor: item.flavor }
  convertingWishlistId.value = item.id
  dialogOpen.value = true
}
const saveDrink = async (draft: DrinkDraft) => {
  try {
    if (editingDrink.value) await updateDrink(editingDrink.value.id, draft)
    else {
      await addDrink(draft)
      if (convertingWishlistId.value) await removeWishlistItem(convertingWishlistId.value)
    }
    dialogOpen.value = false
    newDrinkSeed.value = null
    convertingWishlistId.value = null
  } catch {
    // Keep the dialog open; the composable exposes the server message.
  }
}
const addToWishlist = async (draft: WishlistDraft) => {
  await addWishlistItem(draft).catch(() => undefined)
}
const mergeCollectionBrand = async (sourceBrandId: number, targetName: string) => {
  try {
    await mergeBrand(sourceBrandId, targetName)
    await Promise.all([hydrate(), hydrateWishlist()])
    selectedBrand.value = 'all'
    brandManagerOpen.value = false
  } catch {
    // Keep the dialog open with the composable error.
  }
}
const removeEditingDrink = async () => {
  if (!editingDrink.value) return
  try {
    await deleteDrink(editingDrink.value.id)
    dialogOpen.value = false
  } catch {
    // Keep the dialog open so the user can retry.
  }
}
const clearFilters = () => { query.value = ''; selectedBrand.value = 'all'; buyAgainFilter.value = 'all' }
const selectBrand = (brand: string) => {
  selectedBrand.value = selectedBrand.value === brand ? 'all' : brand
  document.querySelector('#drinks')?.scrollIntoView({ behavior: 'smooth' })
}
const handleSignIn = async (email: string, password: string) => {
  try {
    await signIn(email, password)
    authOpen.value = false
  } catch {
    // The owner dialog displays the authentication error.
  }
}
const handleSignOut = () => signOut().catch(() => undefined)
const reloadAll = () => (user.value
  ? Promise.all([hydrate(), hydrateWishlist()])
  : hydrate()).catch(() => undefined)
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-ink">
    <header class="sticky top-0 z-40 border-b border-acid/20 bg-ink/90 backdrop-blur-xl">
      <div class="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a class="focus-ring flex items-center gap-3 rounded-lg" href="#top" aria-label="Jolt Journal home">
          <span class="cut-corners grid h-11 w-11 place-items-center border border-acid bg-acid/10 text-acid shadow-rune"><Shield :size="24" stroke-width="2.2" /></span>
          <span>
            <span class="block font-display text-lg font-black uppercase tracking-tight sm:text-xl">Jolt Journal</span>
            <span class="tech-label block text-[0.52rem] text-acid">Rating archive // 01</span>
          </span>
        </a>
        <div class="flex items-center gap-2 sm:gap-4">
          <a class="focus-ring hidden rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:text-cream xl:block" href="#brands">Brands</a>
          <a class="focus-ring hidden rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:text-cream xl:block" href="#drinks">All drinks</a>
          <button v-if="user" class="focus-ring hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:text-cream lg:inline-flex" type="button" @click="wishlistOpen = true"><Bookmark :size="16" /> Wishlist <span class="font-mono text-[0.65rem] text-acid">{{ wishlist.length }}</span></button>
          <button v-if="user" class="focus-ring hidden rounded-lg p-2.5 text-muted hover:text-cream lg:block" type="button" aria-label="Manage brands" @click="brandManagerOpen = true"><Tags :size="18" /></button>
          <span v-if="user" class="hidden max-w-40 items-center gap-2 truncate font-mono text-[0.68rem] text-muted md:flex"><UserRound :size="15" class="shrink-0 text-acid" /> {{ user.email }}</span>
          <button v-if="user" class="focus-ring cut-corners hidden items-center gap-2 border border-acid bg-acid px-3 py-2.5 font-mono text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-ember disabled:cursor-wait disabled:opacity-50 sm:px-5 md:inline-flex" type="button" :disabled="pending" @click="openNew">
            <Plus :size="18" stroke-width="2.7" /> Add drink
          </button>
          <button v-if="user" class="focus-ring cut-corners border border-white/10 p-2.5 text-muted hover:border-acid hover:text-acid disabled:cursor-wait disabled:opacity-50" type="button" :disabled="authPending" aria-label="Sign out" @click="handleSignOut">
            <LogOut :size="18" />
          </button>
          <button v-else class="focus-ring cut-corners inline-flex items-center gap-2 border border-white/10 px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-muted hover:border-acid hover:text-cream" type="button" @click="authOpen = true">
            <LogIn :size="17" /> <span class="hidden sm:inline">Curator sign in</span><span class="sm:hidden">Sign in</span>
          </button>
        </div>
      </div>
    </header>

    <main v-if="!authReady" id="top" class="grid min-h-[calc(100vh-5rem)] place-items-center">
      <div class="text-center">
        <LoaderCircle class="mx-auto animate-spin text-acid" :size="34" />
        <p class="tech-label mt-4 text-muted">Opening the vault</p>
      </div>
    </main>

    <main v-else id="top">
      <div v-if="error || (user && wishlistError)" class="border-b border-red-500/40 bg-red-950/80">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <p class="font-mono text-xs text-red-100">Archive link failed: {{ error || (user ? wishlistError : null) }}</p>
          <button class="focus-ring font-mono text-xs font-bold uppercase tracking-wider text-white hover:text-red-200" type="button" @click="reloadAll">Retry</button>
        </div>
      </div>
      <section class="red-grid relative mx-auto max-w-7xl overflow-hidden border-x border-acid/10 px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8">
        <div class="rune-sigil pointer-events-none absolute -right-8 top-0 select-none text-[18rem] font-black leading-none text-acid/[0.08] sm:right-8 sm:text-[28rem]">ᛉ</div>
        <div class="pointer-events-none absolute bottom-0 left-0 h-px w-2/3 bg-acid/50" />
        <div class="relative max-w-4xl">
          <div class="tech-label mb-7 inline-flex items-center gap-2 border-l-2 border-acid bg-acid/10 px-3 py-2 text-acid"><Sparkles :size="14" /> Saga protocol active</div>
          <h1 class="font-display text-[clamp(3rem,9vw,7rem)] font-black uppercase leading-[0.88] tracking-[-0.045em]">Every can<br><span class="text-acid">earns a rune.</span></h1>
          <p class="mt-8 max-w-xl border-l border-white/20 pl-5 text-base leading-relaxed text-steel sm:text-lg">A digital saga of what hit, what missed, and what deserves another place in the cold vault.</p>
          <a class="focus-ring tech-label mt-8 inline-flex items-center gap-3 border-b border-acid pb-2 text-cream hover:text-acid" href="#drinks">Enter the archive <ArrowDown :size="17" /></a>
        </div>
      </section>

      <section class="border-y border-acid/20 bg-panel/95">
        <div class="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-white/10 px-4 sm:px-6 md:grid-cols-4 md:divide-y-0 lg:px-8">
          <div class="py-7 pr-4 md:px-6 md:first:pl-0"><p class="tech-label text-muted">Cans logged</p><p class="mt-2 font-display text-4xl font-black text-cream">{{ drinks.length }}</p></div>
          <div class="px-4 py-7 md:px-6"><p class="tech-label text-muted">Mean power</p><p class="mt-2 font-display text-4xl font-black text-violet">{{ averageRating.toFixed(1) }}<span class="font-mono text-sm text-muted"> / 10</span></p></div>
          <div class="px-4 py-7 md:px-6"><p class="tech-label text-muted">Drinkability</p><p class="mt-2 font-display text-4xl font-black text-acid">{{ buyAgainRate }}<span class="font-mono text-sm">%</span></p></div>
          <div class="py-7 pl-4 md:px-6 md:last:pr-0"><p class="tech-label text-muted">Jarl brand</p><p class="mt-2 truncate font-display text-2xl font-black uppercase text-cream sm:text-3xl">{{ topBrand?.brand ?? '—' }}</p></div>
        </div>
      </section>

      <section id="brands" class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div class="mb-8 flex items-end justify-between gap-4">
          <div><p class="tech-label mb-3 text-acid">Clan index // ranked</p><h2 class="font-display text-4xl font-black uppercase tracking-tight sm:text-5xl">The leaderboard</h2></div>
          <p class="hidden max-w-sm text-right text-sm leading-relaxed text-muted sm:block">Brands need at least {{ minimumLeaderboardDrinks }} logged drinks to rank alone. Smaller collections combine under “Other.”</p>
        </div>
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="(brand, index) in brandStats"
            :key="brand.brand"
            class="focus-ring rune-frame cut-corners group relative overflow-hidden border p-5 text-left transition hover:-translate-y-0.5 hover:border-acid hover:shadow-rune"
            :class="selectedBrand === brand.brand ? 'border-acid bg-acid text-white' : 'border-white/10 bg-panel text-cream'"
            type="button"
            @click="selectBrand(brand.brand)"
          >
            <div class="mb-6 flex items-start justify-between gap-4">
              <span class="tech-label" :class="selectedBrand === brand.brand ? 'text-white/70' : 'text-muted'">Rune {{ String(index + 1).padStart(2, '0') }}</span>
              <div class="flex items-center gap-3">
                <Trophy v-if="index === 0" :size="19" :class="selectedBrand === brand.brand ? 'text-white' : 'text-acid'" />
                <BrandMark :brand="brand.brand" :grouped="Boolean(brand.groupedBrands)" />
              </div>
            </div>
            <h3 class="font-display text-2xl font-black uppercase">{{ brand.brand }}</h3>
            <p v-if="brand.groupedBrands" class="mt-1 font-mono text-[0.68rem] uppercase tracking-wider opacity-60">{{ brand.groupedBrands }} smaller brands combined</p>
            <div class="mt-4 grid grid-cols-3 gap-2 border-t pt-4" :class="selectedBrand === brand.brand ? 'border-ink/20' : 'border-white/10'">
              <div><p class="text-xl font-extrabold">{{ brand.average.toFixed(1) }}</p><p class="text-[11px] uppercase tracking-wide opacity-60">Average</p></div>
              <div><p class="text-xl font-extrabold">{{ brand.drinkability }}%</p><p class="text-[11px] uppercase tracking-wide opacity-60">Buy again</p></div>
              <div><p class="text-xl font-extrabold">{{ brand.count }}</p><p class="text-[11px] uppercase tracking-wide opacity-60">Tried</p></div>
            </div>
          </button>
        </div>
      </section>

      <div v-if="selectedBrand !== 'all'" class="mx-auto -mt-8 mb-12 flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <p class="text-sm text-muted">Filtering the log to <strong class="text-cream">{{ selectedBrand }}</strong><span v-if="selectedBrand === otherBrandLabel"> — brands with fewer than {{ minimumLeaderboardDrinks }} drinks</span></p>
        <button class="focus-ring inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-acid hover:bg-acid/5" type="button" @click="selectedBrand = 'all'"><RotateCcw :size="15" /> Show every brand</button>
      </div>

      <DrinkTable
        :drinks="filteredDrinks"
        :total="drinks.length"
        :query="query"
        :buy-again="buyAgainFilter"
        :sort="sort"
        :editable="Boolean(user)"
        @edit="openEdit"
        @reset="clearFilters"
        @update:query="query = $event"
        @update:buy-again="buyAgainFilter = $event"
        @update:sort="sort = $event"
      />
    </main>

    <footer class="border-t border-acid/20 bg-panel/50" :class="user ? 'pb-24 md:pb-0' : ''">
      <div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Jolt Journal · The archive is backed by Supabase.</p>
        <button class="focus-ring w-fit rounded-lg px-2 py-1 font-semibold hover:text-cream disabled:cursor-wait disabled:opacity-50" type="button" :disabled="pending || wishlistPending" @click="reloadAll">Reload database</button>
      </div>
    </footer>

    <nav v-if="user" class="fixed inset-x-4 bottom-4 z-40 grid grid-cols-3 gap-2 border border-acid/30 bg-panel/95 p-2 shadow-lift backdrop-blur-xl md:hidden" aria-label="Quick actions">
      <button class="focus-ring cut-corners flex flex-col items-center gap-1 bg-acid px-3 py-2 font-mono text-[0.62rem] font-bold uppercase text-white" type="button" @click="openNew"><Plus :size="19" /> Rate</button>
      <button class="focus-ring cut-corners flex flex-col items-center gap-1 border border-white/10 px-3 py-2 font-mono text-[0.62rem] font-bold uppercase text-cream" type="button" @click="wishlistOpen = true"><Bookmark :size="19" /> Hunt {{ wishlist.length }}</button>
      <button class="focus-ring cut-corners flex flex-col items-center gap-1 border border-white/10 px-3 py-2 font-mono text-[0.62rem] font-bold uppercase text-cream" type="button" @click="brandManagerOpen = true"><Tags :size="19" /> Brands</button>
    </nav>

    <DrinkDialog v-if="user" :open="dialogOpen" :drink="editingDrink" :seed="newDrinkSeed" :brands="brands" @close="dialogOpen = false" @save="saveDrink" @delete="removeEditingDrink" />
    <WishlistDialog v-if="user" :open="wishlistOpen" :items="wishlist" :brands="brands" :pending="wishlistPending" :error="wishlistError" @close="wishlistOpen = false" @add="addToWishlist" @remove="removeWishlistItem($event).catch(() => undefined)" @rate="rateWishlistItem" />
    <BrandManagerDialog v-if="user" :open="brandManagerOpen" :brands="brandOptions" :pending="brandPending" :error="brandError" @close="brandManagerOpen = false" @merge="mergeCollectionBrand" />
    <AuthPanel v-if="!user && authOpen" :pending="authPending" :error="authError" :notice="authNotice" @close="authOpen = false" @sign-in="handleSignIn" />
  </div>
</template>
