export interface ICategory {
  _id: string;
  name: string;
  imgURL?: string;
}

export interface ISubCategory {
  _id: string;
  name: string;
  categoryId: string | ICategory;
}
