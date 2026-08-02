export interface Account {
  id: string;
  name: string;
  bankName: string;
  createdAt: string;
  userId: string;
}

export interface CreateAccountPayload {
  name: string;
  bankName: string;
}

export type UpdateAccountPayload = Partial<CreateAccountPayload>;
