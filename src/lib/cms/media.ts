import { getStrapiBaseUrl } from "./client";
import type { CmsImage } from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function unwrapStrapiEntity(value: unknown): UnknownRecord | null {
  if (Array.isArray(value)) {
    return unwrapStrapiEntity(value[0]);
  }

  if (!isRecord(value)) return null;

  if ("data" in value) {
    return unwrapStrapiEntity(value.data);
  }

  const attributes = isRecord(value.attributes) ? value.attributes : null;
  return attributes ? { ...value, ...attributes } : value;
}

export function unwrapStrapiCollection(value: unknown): UnknownRecord[] {
  if (isRecord(value) && "data" in value) {
    return unwrapStrapiCollection(value.data);
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((item) => unwrapStrapiEntity(item))
    .filter((item): item is UnknownRecord => item !== null);
}

export function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeMediaUrl(url: unknown) {
  const mediaUrl = readString(url);
  if (!mediaUrl) return "";
  if (/^https?:\/\//i.test(mediaUrl) || mediaUrl.startsWith("//")) return mediaUrl;

  const baseUrl = getStrapiBaseUrl();
  if (mediaUrl.startsWith("/") && baseUrl) return `${baseUrl}${mediaUrl}`;
  if (mediaUrl.startsWith("/")) return mediaUrl;

  return baseUrl ? `${baseUrl}/${mediaUrl}` : `/${mediaUrl}`;
}

export function normalizeMedia(
  value: unknown,
  fallback: CmsImage,
  explicitAlt?: string,
): CmsImage {
  const media = unwrapStrapiEntity(value);
  if (!media) {
    return {
      ...fallback,
      alt: readString(explicitAlt, fallback.alt),
    };
  }

  const src = normalizeMediaUrl(media.url);
  const alt = readString(
    explicitAlt,
    readString(media.alternativeText, readString(media.caption, readString(media.name, fallback.alt))),
  );
  const width = readNumber(media.width, fallback.width ?? 0);
  const height = readNumber(media.height, fallback.height ?? 0);

  return {
    src: src || fallback.src,
    alt,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
}
