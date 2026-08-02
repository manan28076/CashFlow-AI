import { Search } from "lucide-react";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import type { Category } from "../../types/category";
import type { TransactionQueryParams } from "../../types/transaction";

interface TransactionFiltersProps {
  filters: TransactionQueryParams;
  onChange: (filters: TransactionQueryParams) => void;
  categories: Category[];
}

export const TransactionFilters = ({
  filters,
  onChange,
  categories,
}: TransactionFiltersProps) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
        />
        <Input
          id="search"
          placeholder="Search by merchant or description"
          className="pl-9"
          value={filters.search ?? ""}
          onChange={(e) =>
            onChange({ ...filters, search: e.target.value, page: 1 })
          }
        />
      </div>

      <Select
        id="categoryFilter"
        value={filters.categoryId ?? ""}
        onChange={(e) =>
          onChange({ ...filters, categoryId: e.target.value || undefined, page: 1 })
        }
        className="sm:w-44"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select
        id="typeFilter"
        value={filters.type ?? ""}
        onChange={(e) =>
          onChange({
            ...filters,
            type: (e.target.value || undefined) as TransactionQueryParams["type"],
            page: 1,
          })
        }
        className="sm:w-36"
      >
        <option value="">All Types</option>
        <option value="INCOME">Income</option>
        <option value="EXPENSE">Expense</option>
      </Select>

      <Select
        id="sortBy"
        value={`${filters.sortBy ?? "date"}-${filters.sortOrder ?? "desc"}`}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split("-") as [
            TransactionQueryParams["sortBy"],
            TransactionQueryParams["sortOrder"]
          ];
          onChange({ ...filters, sortBy, sortOrder, page: 1 });
        }}
        className="sm:w-44"
      >
        <option value="date-desc">Newest first</option>
        <option value="date-asc">Oldest first</option>
        <option value="amount-desc">Amount: High to Low</option>
        <option value="amount-asc">Amount: Low to High</option>
      </Select>
    </div>
  );
};
