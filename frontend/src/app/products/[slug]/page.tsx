import { ProductDetailPage } from "@/components/product-detail-page";

type ProductDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailRoute({ params }: ProductDetailRouteProps) {
  const { slug } = await params;

  return <ProductDetailPage slug={slug} />;
}
