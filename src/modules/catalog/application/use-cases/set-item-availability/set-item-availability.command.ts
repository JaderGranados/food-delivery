export interface SetItemAvailabilityCommand {
  restaurantId: string;
  menuItemId: string;
  available: boolean;
}
