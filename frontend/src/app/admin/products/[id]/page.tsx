import { AdminProductEditorPage } from "@/components/admin-product-editor-page";

type AdminProductDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductDetailRoute({ params }: AdminProductDetailRouteProps) {
  const { id } = await params;

  return <AdminProductEditorPage productId={id} />;
}
