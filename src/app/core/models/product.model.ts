import { ICategory, ISubCategory } from './category.model';

export interface IProduct {
  _id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  desc: string;
  desc_ar?: string;
  desc_en?: string;
  price: number;
  discount?: number;
  imgURL: string;
  fullImgUrl?: string;
  stock: number;
  newArrived?: boolean;
  mostPopular?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  slug?: string;
  category?: string | ICategory;
  subCategory?: string | ISubCategory;
}

export interface IProductListRes {
  status: string;
  message?: string;
  results?: number;
  totalResults: number;
  totalPages: number;
  currentPage: number;
  data: IProduct[]; 
}

export interface IProductRes {
  status: string;
  message: string;
  data: IProduct;
}