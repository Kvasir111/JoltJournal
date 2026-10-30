<script setup lang="ts">
import { Layers3 } from '@lucide/vue'
import alaniNuLogo from '~/assets/brand-logos/alani-nu.png'
import c4Logo from '~/assets/brand-logos/c4.jpg'
import celciusLogo from '~/assets/brand-logos/celcius.svg'
import ghostLogo from '~/assets/brand-logos/ghost.png'
import gorillaMindLogo from '~/assets/brand-logos/gorilla-mind.png'
import monsterLogo from '~/assets/brand-logos/monster.svg'
import razeLogo from '~/assets/brand-logos/raze.png'
import redBullLogo from '~/assets/brand-logos/red-bull.svg'
import reignLogo from '~/assets/brand-logos/reign.png'
import rockstarLogo from '~/assets/brand-logos/rockstar.svg'
import ryseLogo from '~/assets/brand-logos/ryse.png'

const props = withDefaults(defineProps<{
  brand: string
  grouped?: boolean
}>(), {
  grouped: false
})

const logos: Record<string, { src: string, dark?: boolean }> = {
  'alani nu': { src: alaniNuLogo },
  'c4': { src: c4Logo },
  'celcius': { src: celciusLogo },
  'celsius': { src: celciusLogo },
  'ghost': { src: ghostLogo, dark: true },
  'gorilla mind': { src: gorillaMindLogo },
  'monster': { src: monsterLogo, dark: true },
  'raze': { src: razeLogo },
  'red bull': { src: redBullLogo },
  'reign': { src: reignLogo, dark: true },
  'rockstar': { src: rockstarLogo, dark: true },
  'ryse': { src: ryseLogo }
}

const failed = ref(false)
const logo = computed(() => logos[props.brand.trim().toLowerCase()])
const initials = computed(() => props.brand
  .split(/\s+/)
  .map(part => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase())

watch(() => props.brand, () => { failed.value = false })
</script>

<template>
  <span
    class="cut-corners grid h-14 w-24 shrink-0 place-items-center overflow-hidden border shadow-lg sm:w-28"
    :class="grouped
      ? 'border-acid/40 bg-acid/10 text-acid'
      : logo?.dark
        ? 'border-white/20 bg-ink'
        : 'border-black/10 bg-[#f3f0e8]'"
    aria-hidden="true"
  >
    <Layers3 v-if="grouped" :size="27" stroke-width="1.8" />
    <span
      v-else-if="logo && !failed"
      class="flex h-10 w-[calc(100%-1rem)] items-center justify-center"
    >
      <img
        class="block max-h-full max-w-full object-contain"
        :src="logo.src"
        alt=""
        loading="lazy"
        @error="failed = true"
      >
    </span>
    <span v-else class="font-display text-lg font-black tracking-tight" :class="logo?.dark ? 'text-cream' : 'text-ink'">{{ initials }}</span>
  </span>
</template>
