export interface Product {
  id: number;
  name: string;
  image: string;
  description: string;
  shortDescription: string;
  price: number;
  category: "starter" | "tooling" | "course" | "bundle" | "swag";
}

const products: Array<Product> = [
  {
    id: 1,
    name: "Start Launch Kit",
    image: "/images/lagoon-1.svg",
    description:
      "A friendly launch bundle for teams shipping with TanStack Start. It includes production-ready auth and deployment checklists, copy-paste CI snippets, and a handoff-ready architecture map so your first release feels calm, predictable, and surprisingly fun.",
    shortDescription:
      "A cozy launch checklist pack for teams adopting TanStack Start.",
    price: 129,
    category: "starter",
  },
  {
    id: 2,
    name: "Query Performance Audit",
    image: "/images/lagoon-2.svg",
    description:
      "A focused tune-up for TanStack Query-heavy apps. We review cache strategy, invalidation patterns, suspense boundaries, and hydration timing to trim overfetching while keeping your UI snappy under real traffic.",
    shortDescription:
      "Speed up data-heavy apps with a practical Query tune-up.",
    price: 249,
    category: "tooling",
  },
  {
    id: 3,
    name: "Router Architecture Course",
    image: "/images/lagoon-3.svg",
    description:
      "An advanced on-demand workshop for route design in large React apps. It covers file-route strategy, nested layouts, data dependencies, and migration playbooks so teams can move from legacy routing without drama.",
    shortDescription:
      "Deep dive course for scaling route architecture with confidence.",
    price: 189,
    category: "course",
  },
  {
    id: 4,
    name: "Full Stack DX Bundle",
    image: "/images/lagoon-4.svg",
    description:
      "A curated bundle of TanStack Router, Query, Form, and Table implementation recipes plus reusable utility code. Built for teams that want solid conventions, faster momentum, and zero type-safety compromises.",
    shortDescription:
      "Battle-tested patterns across the TanStack stack.",
    price: 329,
    category: "bundle",
  },
  {
    id: 5,
    name: "TanStack Team Pack",
    image: "/images/lagoon-5.svg",
    description:
      "A playful but useful merch + onboarding pack for internal champions. Includes architecture cheat sheets, team stickers, and workshop cards to help kick off adoption across product squads with a little personality.",
    shortDescription:
      "Merch + enablement kit for teams standardizing on TanStack.",
    price: 79,
    category: "swag",
  },
];

export default products;
