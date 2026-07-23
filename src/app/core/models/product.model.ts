export interface IProduct {
  _id: string;
  name: string;
  desc: string;
  price: number;
  imgURL: string;
  stock: number;
  newArrived?: boolean;
  mostPopular?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  slug?: string;
  category?: any;
  subCategory?: any;
}

export interface IProductListRes {
  status: string;
  message: string;
  data: IProduct[]; 
}

export interface IProductRes {
  status: string;
  message: string;
  data: IProduct;
}