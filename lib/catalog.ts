export const PRODUCT_CATEGORIES = ["licor", "cerveza", "snack", "otro"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  "efectivo",
  "tarjeta",
  "transferencia",
  "otro",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  licor: "Licor",
  cerveza: "Cerveza",
  snack: "Snack",
  otro: "Otro",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

export function isProductCategory(value: unknown): value is ProductCategory {
  return (
    typeof value === "string" &&
    (PRODUCT_CATEGORIES as readonly string[]).includes(value)
  );
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    (PAYMENT_METHODS as readonly string[]).includes(value)
  );
}