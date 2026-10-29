export interface AddMenuItemCommand {
  restaurantId: string;
  name: string;
  description?: string;
  price: { amount: number; currency: string };
}
