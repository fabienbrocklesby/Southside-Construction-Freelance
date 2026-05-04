export type CmsImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type HomeContent = {
  heroTitle: string;
  heroDescription: string;
  heroImage: CmsImage;
  servicesIntroTitle: string;
  servicesIntroText: string;
};

export type ServiceCard = {
  title: string;
  description: string;
  bulletPoints: string[];
  image: CmsImage;
  order: number;
};

export type GalleryCategory = {
  title: string;
  slug: string;
  thumbnail: CmsImage;
  order: number;
};

export type GalleryPhoto = {
  image: CmsImage;
  caption: string;
  altText: string;
  categorySlug?: string;
  categoryTitle?: string;
  order: number;
};

export type ContactContent = {
  heroTitle: string;
  heroDescription: string;
  heroBackgroundImage: CmsImage;
  formSidePhoto: CmsImage;
};

export type AboutContent = {
  whereWeBuildTitle: string;
  whereWeBuildMainText: string;
  capabilityItems: string[];
  sideImages: CmsImage[];
};
