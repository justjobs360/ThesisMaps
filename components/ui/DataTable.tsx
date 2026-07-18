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
      <div className="border-2 border-black overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead className="bg-black">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b-2 border-black last:border-0">
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
      <div className="border-2 border-black p-12 text-center">
        <p className="text-black/40 font-sans font-bold uppercase tracking-widest text-[10px]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-black overflow-hidden">
      <table className="w-full text-sm font-sans">
        <thead className="bg-black">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={rowKey(row)} className="border-b-2 border-black last:border-0 hover:bg-black/5 transition-colors">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-black">
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
