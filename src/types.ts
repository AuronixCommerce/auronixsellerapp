export type SellerProfile = {
  uid?: string;
  email?: string;
  name?: string;
  displayName?: string;
  businessName?: string;
  phone?: string;
  website?: string;
  role?: string;
  status?: string;
  sellerApplicationId?: string;
};

export type SellerApplication = { status?: string; referenceId?: string; updatedAt?: number };
export type Product = { id: string; name: string; sku?: string; category?: string; price?: string; status?: string };
export type Catalog = { id: string; name: string; url: string; description?: string; createdAt?: number };
export type Ticket = { id: string; subject: string; category: string; message: string; status?: string; createdAt?: number; updatedAt?: number };
export type SellerNotification = { id: string; title?: string; message?: string; type?: string; href?: string; createdAt?: number; readAt?: number };

export type Workspace = {
  serverTime: number;
  profile: SellerProfile;
  application: SellerApplication | null;
  products: Product[];
  catalogs: Catalog[];
  tickets: Ticket[];
};
