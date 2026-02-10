// Type-only re-exports so client components never have a reason to import
// the large server-oriented `src/lib/api/shop.ts` module.
export type {
  CategoryAPIType,
  FitmentData,
  GraphQLCategory,
  GraphQLProductType,
  PLSearchProduct,
  PLSearchProductsResponse,
} from "./shop";

