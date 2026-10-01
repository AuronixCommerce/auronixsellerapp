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
  emailVerified?: boolean;
};

export type SellerApplication = {
  id?: string;
  status?: string;
  referenceId?: string;
  businessName?: string;
  fullName?: string;
  emailVerified?: boolean;
  documentsVerified?: boolean;
  documentsApproved?: boolean;
  businessReviewCompleted?: boolean;
  sellerReviewCompleted?: boolean;
  requestedFields?: string[];
  reviewMessage?: string;
  updatedAt?: number;
};

export type ProductStatus = 'draft' | 'review' | 'active' | 'rejected' | 'paused' | 'archived';

export type Product = {
  id: string;
  name: string;
  title?: string;
  brand?: string;
  sku?: string;
  upc?: string;
  ean?: string;
  asin?: string;
  category?: string;
  description?: string;
  cost?: number | null;
  price?: string | number;
  sellingPrice?: number | null;
  marketplaceFees?: number | null;
  fulfillmentFees?: number | null;
  estimatedProfit?: number | null;
  margin?: number | null;
  roi?: number | null;
  inventoryQuantity?: number;
  lowStockThreshold?: number;
  supplier?: string;
  marketplace?: string;
  imageUrls?: string[];
  status?: ProductStatus | string;
  attention?: string[];
  listingError?: string;
  marketplaceError?: string;
  reviewRequired?: boolean;
  version?: number;
  createdAt?: number;
  updatedAt?: number;
};

export type CatalogStatus = 'uploading' | 'uploaded' | 'processing' | 'analyzed' | 'needs-review' | 'completed' | 'failed' | string;
export type Catalog = {
  id: string;
  name: string;
  url?: string;
  description?: string;
  supplier?: string;
  supplierId?: string;
  originalName?: string;
  contentType?: string;
  size?: number;
  itemCount?: number;
  status?: CatalogStatus;
  aiStatus?: string;
  createdAt?: number;
  updatedAt?: number;
};

export type Supplier = {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  website?: string;
  approvalStatus?: string;
  accountStatus?: string;
  catalogCount?: number;
  productCount?: number;
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
};

export type ProductOpportunity = {
  id: string;
  catalogId?: string;
  productName: string;
  sku?: string;
  upc?: string;
  brand?: string;
  category?: string;
  supplierCost?: number | null;
  suggestedSellingPrice?: number | null;
  estimatedFees?: number | null;
  estimatedProfit?: number | null;
  roi?: number | null;
  riskFlags?: string[];
  marketplace?: string;
  source?: 'catalog-only' | 'marketplace-data';
  status?: string;
};

export type SupportMessage = {
  id?: string;
  role: 'customer' | 'admin' | 'ai';
  content: string;
  createdAt?: number;
  createdBy?: string;
  automated?: boolean;
};

export type Ticket = {
  id: string;
  subject: string;
  category: string;
  message: string;
  status?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent' | string;
  sellerUid?: string;
  assignedAgent?: string;
  lastResponse?: string;
  lastCustomerReplyAt?: number;
  respondedAt?: number;
  messages?: SupportMessage[];
  rating?: number;
  createdAt?: number;
  updatedAt?: number;
};

export type SellerNotification = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  href?: string;
  productId?: string;
  catalogId?: string;
  ticketId?: string;
  documentId?: string;
  createdAt?: number;
  readAt?: number;
};

export type SellerDocument = {
  id: string;
  name: string;
  type?: string;
  category?: string;
  status?: string;
  contentType?: string;
  size?: number;
  storageKey?: string;
  expiresAt?: number;
  createdAt?: number;
  updatedAt?: number;
};

export type MarketplaceConnection = {
  id: 'amazon' | 'walmart' | 'ebay' | string;
  name: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'requires-attention' | 'error';
  configured?: boolean;
  connectedAt?: number;
  lastSyncAt?: number;
  error?: string;
};

export type AnalyticsPoint = {
  date?: string;
  timestamp?: number;
  revenue?: number;
  sales?: number;
  profit?: number;
  inventoryValue?: number;
};

export type AnalyticsSnapshot = {
  revenue: number | null;
  sales: number | null;
  profit: number | null;
  inventoryValue: number | null;
  series: AnalyticsPoint[];
  available: boolean;
};

export type VerificationStep = {
  key: string;
  label: string;
  complete: boolean;
};

export type SellerOverview = {
  serverTime: number;
  profile: SellerProfile;
  application: SellerApplication | null;
  verification: VerificationStep[];
  summary: AnalyticsSnapshot & {
    activeProducts: number;
    productCount: number;
    openTickets: number;
    catalogsProcessing: number;
    productsNeedingAttention: number;
    documentCount: number;
  };
  productsNeedingAttention: Product[];
  openTickets: Ticket[];
  latestUpdates: SellerNotification[];
  recentCatalogs: Catalog[];
  dataAvailability: {
    analytics: boolean;
    inventoryValue: boolean;
    documents: boolean;
  };
};

export type AIMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: number;
};

export type AIConversation = {
  id: string;
  title: string;
  preview?: string;
  messages?: AIMessage[];
  createdAt?: number;
  updatedAt?: number;
};

export type OfflineOperation = {
  id: string;
  entity: 'product' | 'catalog' | 'ticket' | 'notification' | string;
  action: 'create' | 'update' | 'delete' | 'mark-read' | string;
  path: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  payload?: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  status: 'queued' | 'syncing' | 'conflict' | 'failed';
  lastError?: string;
};

export type Workspace = {
  serverTime: number;
  profile: SellerProfile;
  application: SellerApplication | null;
  products: Product[];
  catalogs: Catalog[];
  tickets: Ticket[];
};
