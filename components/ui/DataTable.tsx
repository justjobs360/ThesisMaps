'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey: (row: T) => string;
};

export function DataTable<T>({ columns, data, loading, emptyMessage = 'No results found.', rowKey }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead className="bg-background border-b border-border">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="border border-border rounded-md p-12 text-center">
        <p className="text-text-muted font-sans text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <table className="w-full text-sm font-sans">
        <thead className="bg-background border-b border-border">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border last:border-0 hover:bg-background transition-colors">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-text-primary">
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key as string] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
