interface DataEntry {
  name: string
  currentNumValue: number
  currentStrValue: string
  alarmNumValue: number
  alarmStrValue: string
}

interface ListProps {
  data?: DataEntry[]
}

const sampleData: DataEntry[] = [
  {
    name: "example.com",
    currentNumValue: 120,
    currentStrValue: "02h:00m:00s",
    alarmNumValue: 180,
    alarmStrValue: "03h:00m:00s",
  },
]

const TABLE_HEAD = ["Domain", "Current Time", "Alarm Time"]

export function ActivityWarningList({ data = sampleData }: ListProps) {
  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-900">
      <table className="w-full min-w-max table-auto text-left text-sm">
        <thead className="sticky top-0">
          <tr>
            {TABLE_HEAD.map((head) => (
              <th
                key={head}
                className="border-b p-3 text-left text-xs font-semibold
                         border-gray-200 bg-gray-100 text-gray-700
                         dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
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
            data.map(({ name, currentStrValue, alarmStrValue }) => (
              <tr
                key={name}
                className="border-b border-gray-100 dark:border-gray-700
                         hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td
                  className="p-3 overflow-hidden text-ellipsis whitespace-nowrap text-gray-900 dark:text-white"
                  title={name}
                >
                  {name.length > 20 ? name.substring(0, 20) + "..." : name}
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-300">
                  {currentStrValue}
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-300">
                  {alarmStrValue}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ActivityWarningList