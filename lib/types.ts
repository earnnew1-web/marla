export type OrderStatus =
  | "Pending Payment Confirmation"
  | "Received"
  | "Developing+Scanning"
  | "Ready"
  | "Completed"
  | "Cancelled";

export type FilmType = "Color (C-41)" | "B&W" | "ECN-2";
export type FilmOrderFormat = "35MM" | "120MM";
export type FilmServiceOption =
  | "Dev + Scan (M)"
  | "Dev + Scan (XL)"
  | "Dev Only"
  | "Scan Only (M)"
  | "Scan Only (XL)";
export type BwDeveloper =
  | "Let us choose the best match (Recommended)"
  | "Ilfotech HC"
  | "Microphen"
  | "ID-11";
export type FilmCondition = "Fresh" | "Expired";
export type PushPullType = "Push (+)" | "Pull (-)";
export type PushPullStops = 1 | 2 | 3 | -1 | -2;
export type FileDelivery = "Google Drive" | "Email" | "LINE";
export type FilmReturn = "Pick up at store" | "Delivery (+60 THB)";
export type ReturnMethod = "pickup" | "post";
export type PaymentMethod = "cash" | "bank_transfer";
export type PaymentStatus = "pending_payment_confirmation" | "paid" | "unpaid";
export type FilmDeliveryMethod = "drop_off" | "parcel";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  lineId: string;
  email: string;
  allowSocialShare?: boolean;
  instagramUsername?: string | null;
  lineUserId?: string | null;
  lineDisplayName?: string | null;
  linePictureUrl?: string | null;
  lineConnected?: boolean;
  createdAt: string;
};

export type CustomerDraft = {
  name: string;
  phone: string;
  email: string;
  allowSocialShare?: boolean;
  instagramUsername?: string | null;
  lineUserId?: string | null;
  lineDisplayName?: string | null;
  linePictureUrl?: string | null;
  lineConnected?: boolean;
};

export type FilmRoll = {
  id: string;
  filmType: FilmType;
  format: FilmOrderFormat;
  brand: string;
  brandOther: string;
  stock: string;
  stockOther: string;
  bwDeveloper: BwDeveloper;
  service: FilmServiceOption;
  condition: FilmCondition | null;
  pushPullEnabled: boolean;
  pushPullExpanded: boolean;
  pushPullType: PushPullType;
  pushPullStops: PushPullStops;
  experimentalFilm: boolean;
  price: number;
};

export type ReturnShippingInfo = {
  recipientName: string;
  phone: string;
  address: string;
};

export type DeliveryInfo = {
  fileDelivery: FileDelivery;
  filmReturn: FilmReturn;
  recipientName?: string;
  recipientPhone?: string;
  address?: string;
  notes?: string;
};

export type PaymentInfo = {
  method: PaymentMethod;
  status?: PaymentStatus;
  paymentSlipDataUrl?: string;
  paymentSlipFileName?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  amount?: number;
  confirmedAt?: string;
};

export type Order = {
  id: string;
  orderCode: string;
  customer: Customer;
  rolls: FilmRoll[];
  delivery: DeliveryInfo;
  payment?: PaymentInfo;
  status: OrderStatus;
  totalPrice: number;
  filmTotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  createdAt: string;
  updatedAt?: string;
  filmDeliveryMethod?: FilmDeliveryMethod;
  returnMethod?: ReturnMethod;
};

export type DraftOrder = {
  customer?: CustomerDraft;
  rolls: FilmRoll[];
  returnMethod?: ReturnMethod;
  returnShipping?: ReturnShippingInfo;
  delivery?: DeliveryInfo;
  payment?: PaymentInfo;
  filmDeliveryMethod?: FilmDeliveryMethod;
};

export type PricingSettings = {
  developOnly: number;
  developScanStandard: number;
  developScanXL: number;
  tiffAddon: number;
  pushPullAddon: number;
  deliveryFee: number;
};

export type AdminDashboardStats = {
  newToday: number;
  inProgress: number;
  ready: number;
  completedToday: number;
};

export type AdminCustomerRow = {
  id: string;
  name: string;
  phone: string;
  lineId: string;
  lineDisplayName?: string | null;
  lineConnected?: boolean;
  email: string;
  orderCount: number;
  lastOrderAt: string;
};
