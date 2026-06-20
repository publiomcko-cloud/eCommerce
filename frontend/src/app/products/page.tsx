import { Suspense } from "react";

import { ProductListingPage } from "@/components/product-listing-page";

export default function ProductsRoute() {
  return (
    <Suspense>
      <ProductListingPage />
    </Suspense>
  );
}
