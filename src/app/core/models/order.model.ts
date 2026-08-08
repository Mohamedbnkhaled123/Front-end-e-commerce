export interface IShippingAddress {
  title?: string;
  city: string;
  street: string;
  buildingNumber?: string;
  floorNumber?: string;
  phoneNumber: string;
}

export interface IProductSummary {
  _id: string;
  name: string;
  imgURL?: string;
  price?: number;
}

export interface IUserSummary {
  _id: string;
  name: string;
  email?: string;
}

export interface IOrderItem {
  productId: string | IProductSummary | any;
  quantity: number;
  priceAtPurchase: number;
  discountPercent?: number;
  discountedPrice?: number;
}

export interface IOrder {
  _id: string;
  user?: IUserSummary;
  items: IOrderItem[];
  grossTotal?: number;
  shippingFee?: number;
  totalDiscount?: number;
  netTotal?: number;
  totalPrice: number;
  orderStatus: string;
  shippingAddress?: IShippingAddress;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOrderRes {
  status: string;
  message?: string;
  data: IOrder;
}

export interface IOrderListRes {
  status: string;
  message?: string;
  data: IOrder[];
}
