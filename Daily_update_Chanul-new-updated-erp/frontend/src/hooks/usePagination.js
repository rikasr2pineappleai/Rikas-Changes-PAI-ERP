// placeholder usePagination hook
import { useMemo, useState } from 'react';

export default function usePagination(items = [], pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const data = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);
  return { page, setPage, totalPages, data };
}

