import { IProductSummary } from './order.model';

export interface ICartItem {
  productId: string;
  name: string;
  priceAtAddition: number;
  originalPrice?: number;
  discountPercent?: number;
  quantity: number;
  isPriceChanged?: boolean;
  productImg?: string;
}

export interface ICartItemRaw {
  productId?: string | (IProductSummary & { discount?: number });
  name?: string;
  quantity: number;
  priceAtAddition: number;
  discountPercent?: number;
  isPriceChanged?: boolean;
}
