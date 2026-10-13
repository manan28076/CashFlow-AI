export interface Category {
  id: string;
  name: string;
  type?: "INCOME" | "EXPENSE";
}

export interface CreateCategoryPayload {
  name: string;
  type?: "INCOME" | "EXPENSE";
}
