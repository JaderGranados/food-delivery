import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  AddMenuItemUseCase,
  GetRestaurantMenuUseCase,
  RegisterRestaurantUseCase,
  SetItemAvailabilityUseCase,
  type MenuItemView,
  type RegisteredRestaurant,
  type RestaurantMenu,
} from '../../application/index.js';
import {
  AddMenuItemDto,
  RegisterRestaurantDto,
  SetItemAvailabilityDto,
} from './dtos/index.js';
import { Controller as BaseController } from '@shared/infrastructure/index.js';

@Controller('restaurants')
export class CatalogController extends BaseController {
  constructor(
    private readonly registerRestaurant: RegisterRestaurantUseCase,
    private readonly addMenuItem: AddMenuItemUseCase,
    private readonly setItemAvailability: SetItemAvailabilityUseCase,
    private readonly getRestaurantMenu: GetRestaurantMenuUseCase,
  ) {
    super();
  }

  @Post()
  async register(
    @Body() body: RegisterRestaurantDto,
  ): Promise<RegisteredRestaurant> {
    try {
      return await this.registerRestaurant.execute(body);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post(':id/menu-items')
  async addItem(
    @Param('id') restaurantId: string,
    @Body() body: AddMenuItemDto,
  ): Promise<MenuItemView> {
    try {
      return await this.addMenuItem.execute({
        restaurantId,
        name: body.name,
        description: body.description,
        price: { amount: body.price.amount, currency: body.price.currency },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':id/menu-items/:itemId/availability')
  async setAvailability(
    @Param('id') restaurantId: string,
    @Param('itemId') menuItemId: string,
    @Body() body: SetItemAvailabilityDto,
  ): Promise<MenuItemView> {
    try {
      return await this.setItemAvailability.execute({
        restaurantId,
        menuItemId,
        available: body.available,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get(':id/menu')
  async menu(@Param('id') restaurantId: string): Promise<RestaurantMenu> {
    try {
      return await this.getRestaurantMenu.execute({ restaurantId });
    } catch (error) {
      this.handleError(error);
    }
  }
}
