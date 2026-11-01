import { toolDefinition } from "@tanstack/ai";
import products from "@/data/products";

export const getProductsToolDef = toolDefinition({
  name: "getProducts",
  description: "Get all products from the catalog",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  outputSchema: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
        image: { type: "string" },
        description: { type: "string" },
        shortDescription: { type: "string" },
        price: { type: "number" },
        category: {
          type: "string",
          enum: ["starter", "tooling", "course", "bundle", "swag"],
        },
      },
      required: [
        "id",
        "name",
        "image",
        "description",
        "shortDescription",
        "price",
        "category",
      ],
      additionalProperties: false,
    },
  },
});

export const getProducts = getProductsToolDef.server(() => products);

export const recommendProductToolDef = toolDefinition({
  name: "recommendProduct",
  description:
    "REQUIRED tool to display a product recommendation to the user. This tool MUST be used whenever recommending a product - do NOT write recommendations yourself. This displays the product in a special format with a view details button.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        oneOf: [{ type: "string" }, { type: "number" }],
        description:
          "The ID of the product to recommend (from the getProducts results)",
      },
    },
    required: ["id"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: {
      id: { type: "number" },
    },
    required: ["id"],
    additionalProperties: false,
  },
});
