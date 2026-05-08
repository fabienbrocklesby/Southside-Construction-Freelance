import { fetchStrapiData, type StrapiQuery } from "./client";
import {
  fallbackAboutContent,
  fallbackContactContent,
  fallbackGalleryCategories,
  fallbackGalleryPhotos,
  fallbackHomeContent,
  fallbackServiceCards,
} from "./fallbacks";
import {
  normalizeMedia,
  readNumber,
  readString,
  unwrapStrapiCollection,
  unwrapStrapiEntity,
} from "./media";
import type {
  AboutContent,
  ContactContent,
  GalleryCategory,
  GalleryPhoto,
  HomeContent,
  ServiceCard,
} from "./types";

export type {
  AboutContent,
  CmsImage,
  ContactContent,
  GalleryCategory,
  GalleryPhoto,
  HomeContent,
  ServiceCard,
} from "./types";

const publishedQuery: StrapiQuery = {
  status: "published",
};

const orderedCollectionQuery: StrapiQuery = {
  ...publishedQuery,
  "sort[0]": "order:asc",
  "pagination[pageSize]": 100,
};

const homePageQuery: StrapiQuery = {
  ...publishedQuery,
  "populate[heroImage]": "true",
};

const serviceCardsQuery: StrapiQuery = {
  ...orderedCollectionQuery,
  "populate[image]": "true",
  "populate[bulletPoints]": "true",
};

const galleryCategoriesQuery: StrapiQuery = {
  ...orderedCollectionQuery,
  "populate[thumbnailImage]": "true",
};

const galleryPhotosQuery: StrapiQuery = {
  ...orderedCollectionQuery,
  "populate[image]": "true",
  "populate[category]": "true",
};

const contactPageQuery: StrapiQuery = {
  ...publishedQuery,
  "populate[heroBackgroundImage]": "true",
  "populate[formSidePhoto]": "true",
};

const aboutPageQuery: StrapiQuery = {
  ...publishedQuery,
  "populate[capabilityItems]": "true",
  "populate[sideImages][populate]": "image",
};

function stringsFromComponents(value: unknown, fallback: string[]) {
  const items = unwrapStrapiCollection(value)
    .map((item) => readString(item.text))
    .filter(Boolean);

  return items.length ? items : fallback;
}

function isEnabled(item: Record<string, unknown>) {
  return item.enabled !== false;
}

function sortByOrder<T extends { order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order);
}

export async function getHomeContent(): Promise<HomeContent> {
  const data = await fetchStrapiData("/api/home-page", homePageQuery, "home-page");
  const item = unwrapStrapiEntity(data);
  if (!item) return fallbackHomeContent;

  return {
    heroTitle: readString(item.heroTitle, fallbackHomeContent.heroTitle),
    heroDescription: readString(item.heroDescription, fallbackHomeContent.heroDescription),
    heroImage: normalizeMedia(item.heroImage, fallbackHomeContent.heroImage),
    servicesIntroTitle: readString(
      item.servicesIntroTitle,
      fallbackHomeContent.servicesIntroTitle,
    ),
    servicesIntroText: readString(item.servicesIntroText, fallbackHomeContent.servicesIntroText),
  };
}

export async function getServiceCards(): Promise<ServiceCard[]> {
  const data = await fetchStrapiData(
    "/api/what-we-build-cards",
    serviceCardsQuery,
    "what-we-build-cards",
  );
  const items = unwrapStrapiCollection(data).filter(isEnabled);
  if (!items.length) return fallbackServiceCards;

  return sortByOrder(
    items.map((item, index) => {
      const fallback = fallbackServiceCards[index] ?? fallbackServiceCards[0];

      return {
        title: readString(item.title, fallback.title),
        description: readString(item.description, fallback.description),
        bulletPoints: stringsFromComponents(item.bulletPoints, fallback.bulletPoints),
        image: normalizeMedia(
          item.image,
          fallback.image,
          readString(item.imageAltText, fallback.image.alt),
        ),
        order: readNumber(item.order, fallback.order),
      };
    }),
  );
}

export async function getGalleryCategories(): Promise<GalleryCategory[]> {
  const data = await fetchStrapiData(
    "/api/gallery-categories",
    galleryCategoriesQuery,
    "gallery-categories",
  );
  const items = unwrapStrapiCollection(data);
  if (!items.length) return fallbackGalleryCategories;

  return sortByOrder(
    items.map((item, index) => {
      const fallback = fallbackGalleryCategories[index] ?? fallbackGalleryCategories[0];

      return {
        title: readString(item.title, fallback.title),
        slug: readString(item.slug, fallback.slug),
        thumbnail: normalizeMedia(
          item.thumbnailImage,
          fallback.thumbnail,
          readString(item.thumbnailAltText, fallback.thumbnail.alt),
        ),
        order: readNumber(item.order, fallback.order),
      };
    }),
  );
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const data = await fetchStrapiData(
    "/api/gallery-photos",
    galleryPhotosQuery,
    "gallery-photos",
  );
  const items = unwrapStrapiCollection(data);
  if (!items.length) return fallbackGalleryPhotos;

  return sortByOrder(
    items.map((item, index) => {
      const fallback = fallbackGalleryPhotos[index] ?? fallbackGalleryPhotos[0];
      const category = unwrapStrapiEntity(item.category);
      const altText = readString(item.altText, fallback.altText);

      return {
        image: normalizeMedia(item.image, fallback.image, altText),
        caption: readString(item.caption, fallback.caption),
        altText,
        categorySlug: readString(category?.slug, fallback.categorySlug),
        categoryTitle: readString(category?.title, fallback.categoryTitle),
        order: readNumber(item.order, fallback.order),
      };
    }),
  );
}

export async function getContactContent(): Promise<ContactContent> {
  const data = await fetchStrapiData("/api/contact-page", contactPageQuery, "contact-page");
  const item = unwrapStrapiEntity(data);
  if (!item) return fallbackContactContent;

  return {
    heroTitle: readString(item.heroTitle, fallbackContactContent.heroTitle),
    heroDescription: readString(item.heroDescription, fallbackContactContent.heroDescription),
    heroBackgroundImage: normalizeMedia(
      item.heroBackgroundImage,
      fallbackContactContent.heroBackgroundImage,
      readString(
        item.heroBackgroundAltText,
        fallbackContactContent.heroBackgroundImage.alt,
      ),
    ),
    formSidePhoto: normalizeMedia(
      item.formSidePhoto,
      fallbackContactContent.formSidePhoto,
      readString(item.formSidePhotoAltText, fallbackContactContent.formSidePhoto.alt),
    ),
  };
}

export async function getAboutContent(): Promise<AboutContent> {
  const data = await fetchStrapiData("/api/about-page", aboutPageQuery, "about-page");
  const item = unwrapStrapiEntity(data);
  if (!item) return fallbackAboutContent;

  const cmsSideImages = unwrapStrapiCollection(item.sideImages);
  const sideImages = fallbackAboutContent.sideImages.map((fallback, index) => {
    const sideImage = cmsSideImages[index];
    if (!sideImage) return fallback;

    return normalizeMedia(
      sideImage.image,
      fallback,
      readString(sideImage.altText, fallback.alt),
    );
  });

  return {
    whereWeBuildTitle: readString(
      item.whereWeBuildTitle,
      fallbackAboutContent.whereWeBuildTitle,
    ),
    whereWeBuildMainText: readString(
      item.whereWeBuildMainText,
      fallbackAboutContent.whereWeBuildMainText,
    ),
    capabilityItems: stringsFromComponents(
      item.capabilityItems,
      fallbackAboutContent.capabilityItems,
    ),
    sideImages,
  };
}

export {
  fallbackAboutContent,
  fallbackContactContent,
  fallbackGalleryCategories,
  fallbackGalleryPhotos,
  fallbackHomeContent,
  fallbackServiceCards,
};
