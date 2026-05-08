import type {
  AboutContent,
  ContactContent,
  GalleryCategory,
  GalleryPhoto,
  HomeContent,
  ServiceCard,
} from "./types";

export const fallbackHomeContent: HomeContent = {
  heroTitle: "Building excellence across Nelson Tasman",
  heroDescription:
    "New house builds, sheds, renovations, decks and fencing, crafted with precision, delivered with care, and built to last in our local climate.",
  heroImage: {
    src: "/images/IMG_0609.jpg",
    alt: "Modern home exterior built by Southside Construction",
  },
  servicesIntroTitle: "What we build",
  servicesIntroText:
    "From dream homes to durable sheds and outdoor living, we deliver thoughtful builds that suit your site, budget, and lifestyle. Need something not listed? We take on custom projects after a quick chat to scope it properly.",
};

export const fallbackServiceCards: ServiceCard[] = [
  {
    title: "New house building",
    description:
      "Architecturally-led or design-and-build, we manage details from foundations to finishes - warm, efficient, and fit for Nelson Tasman conditions.",
    bulletPoints: [
      "Design coordination and council consent",
      "Energy-efficient framing and insulation",
      "High-quality interior fit-out",
    ],
    image: {
      src: "/thumbs/640/IMG_1105.jpg",
      alt: "New house build exterior",
      width: 640,
      height: 480,
    },
    order: 10,
  },
  {
    title: "Sheds",
    description:
      "Workshops, farm sheds, and storage buildings built tough - sized to your needs with durable cladding and secure access systems.",
    bulletPoints: [
      "Concrete pads and drainage",
      "Roller doors, windows, ventilation",
      "Rural and residential sites",
    ],
    image: {
      src: "/thumbs/640/IMG_9520.jpg",
      alt: "Custom shed build",
      width: 640,
      height: 480,
    },
    order: 20,
  },
  {
    title: "Renovations",
    description:
      "Transform kitchens, bathrooms, and living spaces. We improve flow, light, and performance without disrupting your daily life.",
    bulletPoints: [
      "Structural alterations and relevels",
      "Warm, dry, and weathertight upgrades",
      "Seamless extensions and re-clads",
    ],
    image: {
      src: "/thumbs/640/IMG_1075.jpg",
      alt: "Renovated interior space",
      width: 640,
      height: 480,
    },
    order: 30,
  },
  {
    title: "Decks & fencing",
    description:
      "Extend your living outdoors with durable decking and privacy fencing - perfect for summer in Tasman.",
    bulletPoints: [
      "Hardwood, pine, and composite options",
      "Stairs, handrails, and screens",
      "Engineered substructures",
    ],
    image: {
      src: "/thumbs/640/IMG_7832.jpg",
      alt: "Timber deck and fencing",
      width: 640,
      height: 480,
    },
    order: 40,
  },
];

export const fallbackGalleryCategories: GalleryCategory[] = [
  {
    title: "Project Gallery",
    slug: "project-gallery",
    thumbnail: {
      src: "/images/IMG_0611.jpg",
      alt: "Southside Construction project gallery",
    },
    order: 10,
  },
];

const fallbackGalleryImageNames = [
  "Image1.jpg",
  "IMG_0045.jpg",
  "IMG_0051.jpg",
  "IMG_0323.jpg",
  "IMG_0415.jpg",
  "IMG_0557.jpg",
  "IMG_0558.jpg",
  "IMG_0559.jpg",
  "IMG_0609.jpg",
  "IMG_0611.jpg",
  "IMG_0716.jpg",
  "IMG_0832.jpg",
  "IMG_0861.jpg",
  "IMG_0871.jpg",
  "IMG_0872.jpg",
  "IMG_0873.jpg",
  "IMG_0874.jpg",
  "IMG_0875.jpg",
  "IMG_0876.jpg",
  "IMG_0919.jpg",
  "IMG_0920.jpg",
  "IMG_0946.jpg",
  "IMG_0947.jpg",
  "IMG_1061.jpg",
  "IMG_1063.jpg",
  "IMG_1064.jpg",
  "IMG_1074.jpg",
  "IMG_1075.jpg",
  "IMG_1103.jpg",
  "IMG_1104.jpg",
  "IMG_1105.jpg",
  "IMG_1200.jpg",
  "IMG_1202.jpg",
  "IMG_1203.jpg",
  "IMG_1204.jpg",
  "IMG_2538.jpg",
  "IMG_2541.jpg",
  "IMG_2611.jpg",
  "IMG_2612.jpg",
  "IMG_2614.jpg",
  "IMG_2615.jpg",
  "IMG_4306.jpg",
  "IMG_4307.jpg",
  "IMG_4902.jpg",
  "IMG_5019.jpg",
  "IMG_5022.jpg",
  "IMG_5660.jpg",
  "IMG_6336.jpg",
  "IMG_6337.jpg",
  "IMG_6383.jpg",
  "IMG_6384.jpg",
  "IMG_6385.jpg",
  "IMG_6389.jpg",
  "IMG_7832.jpg",
  "IMG_7833.jpg",
  "IMG_8013.jpg",
  "IMG_8598.jpg",
  "IMG_9427.jpg",
  "IMG_9428.jpg",
  "IMG_9432.jpg",
  "IMG_9442.jpg",
  "IMG_9484.jpg",
  "IMG_9485.jpg",
  "IMG_9520.jpg",
  "IMG_9521.jpg",
  "IMG_9535.jpg",
];

export const fallbackGalleryPhotos: GalleryPhoto[] = fallbackGalleryImageNames.map(
  (fileName, index) => ({
    image: {
      src: `/images/${fileName}`,
      alt: "Southside Construction project photo",
    },
    caption: "",
    altText: "Southside Construction project photo",
    categorySlug: "project-gallery",
    categoryTitle: "Project Gallery",
    order: index + 1,
  }),
);

export const fallbackContactContent: ContactContent = {
  heroTitle: "Let's talk about your project",
  heroDescription:
    "New build, renovation, shed, or outdoor - tell us what you're planning and we'll get back with next steps.",
  heroBackgroundImage: {
    src: "/images/IMG_0611.jpg",
    alt: "Outdoor deck area",
  },
  formSidePhoto: {
    src: "/thumbs/960/IMG_5660.jpg",
    alt: "Site and tools",
    width: 960,
    height: 720,
  },
};

export const fallbackAboutContent: AboutContent = {
  whereWeBuildTitle: "Where and what we build",
  whereWeBuildMainText:
    "We cover Nelson, Tasman, Richmond, Motueka, Mapua, and nearby communities. From new house builds to sheds, renovations, and outdoor living - we tailor the approach to your site and lifestyle.",
  capabilityItems: [
    "New homes",
    "Sheds & workshops",
    "Renovations",
    "Extensions",
    "Decks & fencing",
    "Re-clads",
  ],
  sideImages: [
    {
      src: "/thumbs/640/IMG_7833.jpg",
      alt: "Deck and railing detail",
      width: 640,
      height: 480,
    },
    {
      src: "/thumbs/640/IMG_5660.jpg",
      alt: "Shed exterior with durable cladding",
      width: 640,
      height: 480,
    },
    {
      src: "/thumbs/960/IMG_9432.jpg",
      alt: "Renovated interior",
      width: 960,
      height: 720,
    },
  ],
};
