import { FKBadge } from './FKBadge';
import type { Column } from '../types';

interface Props<T> {
  title: string;
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => number;
  selectedId: number | null;
  linkedIds: number[];
  pulseKey: number;
  onRowClick: (id: number) => void;
}

export function DataTable<T>({
  title,
  columns,
  rows,
  getRowId,
  selectedId,
  linkedIds,
  pulseKey,
  onRowClick,
}: Props<T>) {
  return (
    <div className="flex flex-col min-w-0">
      <h3 className="text-xs font-semibold font-mono uppercase tracking-wide text-[#4A6B52] mb-2">
        {title}
      </h3>
      <div className="border border-[#D4D2CC] rounded-md overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#F5F3EE]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-3 py-2 text-xs font-semibold text-[#4A6B52] border-b border-[#D4D2CC] whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.label}
                  {col.isFK && <FKBadge />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = getRowId(row);
              const isSelected = id === selectedId;
              const isLinked = linkedIds.includes(id);
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick(id)}
                  className={`cursor-pointer border-b border-[#D4D2CC] last:border-0 transition-colors duration-100 ${
                    isSelected
                      ? 'bg-[#2D5E3A] text-white'
                      : isLinked
                      ? 'bg-[#C8DBBC] text-[#1B3A28]'
                      : 'bg-white text-[#1B3A28] hover:bg-[#EBE9E3]'
                  }`}
                >
                  {columns.map((col) => {
                    const value = row[col.key];
                    const isFKCell = col.isFK && isLinked;
                    return (
                      <td
                        key={String(col.key)}
                        className={`px-3 py-2.5 ${
                          col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                        }`}
                      >
                        {isFKCell ? (
                          <span key={pulseKey} className="fk-pulse font-semibold">
                            {col.render ? col.render(value) : String(value)}
                          </span>
                        ) : col.render ? (
                          col.render(value)
                        ) : (
                          String(value)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
