export interface IReviewUser {
  _id: string;
  name: string;
  email?: string;
}

export interface IReviewProduct {
  _id: string;
  name: string;
  imgURL?: string;
  slug?: string;
  price?: number;
}

export interface IReview {
  _id: string;
  userId: IReviewUser | any;
  productId: IReviewProduct | any;
  orderId?: string;
  text: string;
  rating: number;
  status: 'Pending' | 'Approved' | 'Cancelled';
  createdAt?: string;
}

export interface IProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  starCounts: { [key: number]: number };
}

export interface IProductReviewsRes {
  status: string;
  results: number;
  summary: IProductReviewSummary;
  data: IReview[];
}
