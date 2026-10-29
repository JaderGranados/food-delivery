export interface PlaceOrderCommand {
  customerId: string;
  restaurantId: string;
  items: { menuItemId: string; quantity: number }[];
}
