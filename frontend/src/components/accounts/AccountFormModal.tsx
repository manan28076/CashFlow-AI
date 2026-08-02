import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import type { Account, CreateAccountPayload } from "../../types/account";

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAccountPayload) => Promise<void>;
  initialData?: Account | null;
}

export const AccountFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: AccountFormModalProps) => {
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name ?? "");
      setBankName(initialData?.bankName ?? "");
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ name, bankName });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Account" : "Add Account"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="accountName"
          label="Account Name"
          placeholder="e.g. Salary Account"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          id="bankName"
          label="Bank Name"
          placeholder="e.g. HDFC Bank"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          required
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          {initialData ? "Save Changes" : "Add Account"}
        </Button>
      </form>
    </Modal>
  );
};
