interface DataEntry {
  name: string
  numValue: number
  strValue: string
}

interface ListProps {
  data?: DataEntry[]
}

const TABLE_HEAD = ["Domain", "Time", ""]

export function List({ data = [] }: ListProps) {
  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden">
      <table className="w-full min-w-max table-auto text-left text-sm">
        <thead className="sticky top-0">
          <tr>
            {TABLE_HEAD.map((head) => (
              <th
                key={head}
                className="border-b p-3 text-left text-xs font-semibold
                         border-gray-200 dark:border-gray-700
                         bg-gray-100 dark:bg-gray-800
                         text-gray-700 dark:text-gray-200"
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="p-4 text-center text-gray-500 dark:text-gray-400"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map(({ name, strValue }) => (
              <tr
                key={name}
                className="border-b border-gray-100 dark:border-gray-700"
              >
                <td
                  className="p-3 overflow-hidden text-ellipsis whitespace-nowrap
                           text-gray-900 dark:text-gray-100"
                  title={name}
                >
                  {name.length > 20 ? name.substring(0, 20) + "..." : name}
                </td>

                <td className="p-3 text-gray-700 dark:text-gray-300">
                  {strValue}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default List