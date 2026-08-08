import { IProductSummary } from './order.model';

export interface ICartItem {
  productId: string;
  name: string;
  priceAtAddition: number;
  quantity: number;
  isPriceChanged?: boolean;
  productImg?: string;
}

export interface ICartItemRaw {
  productId?: string | IProductSummary;
  name?: string;
  quantity: number;
  priceAtAddition: number;
  isPriceChanged?: boolean;
}
