import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <Button
        label="Previous"
        variant="outline"
        size="sm"
        icon={<ChevronLeft size={14} />}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      />
      <span className="text-xs text-muted">
        Page {page} of {pageCount}
      </span>
      <Button
        label="Next"
        variant="outline"
        size="sm"
        icon={<ChevronRight size={14} />}
        iconPosition="right"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      />
    </div>
  );
}
