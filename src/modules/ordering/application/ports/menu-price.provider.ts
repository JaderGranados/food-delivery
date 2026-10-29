export interface MenuSnapshotItem {
  id: string;
  name: string;
  price: { amount: number; currency: string };
  available: boolean;
}

export interface MenuSnapshot {
  restaurantId: string;
  items: MenuSnapshotItem[];
}

/** Ordering's view of the catalog: the menu as it is right now. */
export interface MenuPriceProvider {
  /** Resolves to `null` when the restaurant does not exist. */
  getMenu(restaurantId: string): Promise<MenuSnapshot | null>;
}
