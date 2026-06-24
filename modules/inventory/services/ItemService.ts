import { ItemRepository } from '../repositories/ItemRepository';
import { CreateItemInputSchema, UpdateItemInputSchema } from '../validations/item.schema';
// import { EventBus } from '../../core/events'; // Placeholder for EventBus

export class ItemService {
  static async createItem(orgId: string, data: any) {
    // 1. Validate Input
    const parsedData = CreateItemInputSchema.parse(data);

    // 2. Business Rules
    const existingSku = await ItemRepository.findBySku(orgId, parsedData.sku);
    if (existingSku) {
      throw new Error("An item with this SKU already exists.");
    }

    // 3. Create
    const item = await ItemRepository.create(orgId, parsedData);

    // 4. Emit Event
    // EventBus.emit('ItemCreated', { orgId, itemId: item.id });

    return item;
  }

  static async updateItem(orgId: string, id: string, data: any) {
    const parsedData = UpdateItemInputSchema.parse(data);

    // Check if SKU is being updated to an existing one
    if (parsedData.sku) {
      const existingSku = await ItemRepository.findBySku(orgId, parsedData.sku);
      if (existingSku && existingSku.id !== id) {
        throw new Error("An item with this SKU already exists.");
      }
    }

    return ItemRepository.update(orgId, id, parsedData);
  }

  static async getItems(orgId: string, params: { skip?: number, take?: number, search?: string }) {
    return ItemRepository.findMany(orgId, params);
  }

  static async getItem(orgId: string, id: string) {
    return ItemRepository.findById(orgId, id);
  }
}
