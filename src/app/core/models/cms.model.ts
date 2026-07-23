export interface ICmsPage {
  _id: string;
  pageName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICmsPageRes {
  status: string;
  data: ICmsPage;
}

export interface ICmsUpdateRes {
  status: string;
  message: string;
  data: ICmsPage;
}

export type CmsPageName = 'About' | 'Policy' | 'FAQ' | 'Contact';
