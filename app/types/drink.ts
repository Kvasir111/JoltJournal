export type BuyAgain = 'yes' | 'no' | 'unknown'

export interface Drink {
  id: string
  brandId: number
  brand: string
  flavor: string
  rating: number
  buyAgain: BuyAgain
}

export interface WishlistItem {
  id: string
  brandId: number
  brand: string
  flavor: string
  createdAt: string
}

export interface WishlistDraft {
  brand: string
  flavor: string
}

export interface DrinkDraft {
  brand: string
  flavor: string
  rating: number
  buyAgain: BuyAgain
}
