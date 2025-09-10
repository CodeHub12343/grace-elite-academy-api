export function Table({ columns = [], rows = [], renderCell }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-2 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2 ${c.align === 'right' ? 'text-right' : ''}`}>{renderCell ? renderCell(c, row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}




























