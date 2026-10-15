import { useEffect, useState } from 'react';
import { ui } from '../../styles/ui';
import Button from './Button';

/**
 * Table on md+, stacked cards on phones.
 * Column flags: `primary` (card title), `aside` (card top-right), `actions` (card footer),
 * `mobileHidden`, `align: 'right'`. `render(row)` overrides `row[key]`.
 */
export default function DataTable({ columns, rows, empty = 'Nothing to show.', onRowClick, pageSize = 0 }) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [rows.length]);

  const pageCount = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const visible = pageSize ? rows.slice(page * pageSize, page * pageSize + pageSize) : rows;

  const primary = columns.find((c) => c.primary) || columns[0];
  const aside = columns.find((c) => c.aside);
  const actions = columns.find((c) => c.actions);
  const details = columns.filter((c) => c !== primary && c !== aside && c !== actions && !c.mobileHidden);
  const cell = (column, row) => (column.render ? column.render(row) : row[column.key]);

  return (
    <div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className={`border-b bg-gray-50/70 text-left text-xs font-medium uppercase tracking-wide dark:bg-gray-800/40 ${ui.line} ${ui.muted}`}>
              {columns.map((c) => (
                <th key={c.key} className={`whitespace-nowrap px-5 py-2.5 ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={ui.divide}>
            {visible.map((row) => (
              <tr key={row.id} onClick={onRowClick ? () => onRowClick(row) : undefined} className={`${ui.hover} ${onRowClick ? 'cursor-pointer' : ''}`}>
                {columns.map((c) => (
                  <td key={c.key} className={`px-5 py-3 ${ui.body} ${c.align === 'right' ? 'whitespace-nowrap text-right tabular-nums' : ''}`}>
                    {cell(c, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className={`md:hidden ${ui.divide}`}>
        {visible.map((row) => (
          <li key={row.id} onClick={onRowClick ? () => onRowClick(row) : undefined} className={`px-4 py-3.5 ${onRowClick ? `cursor-pointer ${ui.hover}` : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className={`min-w-0 text-sm font-medium ${ui.h}`}>{cell(primary, row)}</div>
              {aside && <div className="shrink-0 text-sm tabular-nums">{cell(aside, row)}</div>}
            </div>
            {details.length > 0 && (
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                {details.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className={ui.muted}>{c.label}</dt>
                    <dd className={`mt-0.5 truncate ${ui.body}`}>{cell(c, row)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {actions && <div className="mt-2.5 flex justify-end">{cell(actions, row)}</div>}
          </li>
        ))}
      </ul>

      {rows.length === 0 && <p className={`px-5 py-10 text-center text-sm ${ui.muted}`}>{empty}</p>}

      {pageSize > 0 && rows.length > pageSize && (
        <div className={`flex items-center justify-between gap-2 border-t px-4 py-3 text-sm sm:px-5 ${ui.line} ${ui.muted}`}>
          <span>
            {page * pageSize + 1}–{Math.min(rows.length, (page + 1) * pageSize)} of {rows.length}
          </span>
          <div className="flex gap-2">
            <Button size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
