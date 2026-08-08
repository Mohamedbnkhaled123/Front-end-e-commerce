export interface ICoupon {
  _id: string;
  code: string;
  discountPercent: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  expiresAt?: string | null;
  isActive: boolean;
  usageLimit?: number | null;
  usageCount: number;
  createdAt?: string;
}

export interface ICouponListRes {
  status: string;
  results: number;
  data: ICoupon[];
}

export interface ICouponValidateRes {
  status: string;
  message: string;
  data: {
    code: string;
    discountPercent: number;
    discountAmount: number;
    minOrderAmount?: number;
  };
}
