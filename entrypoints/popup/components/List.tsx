interface DataEntry {
  name: string;
  numValue: number;
  strValue: string
}

interface ListProps {
  data?: DataEntry[];
}

const TABLE_HEAD = ["Domain", "Time", ""];

export function List({ data = [] }: ListProps) {
  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden">
      <table className="w-full min-w-max table-auto text-left text-sm">
        <thead className="sticky top-0">
          <tr>
            {TABLE_HEAD.map((head) => (
              <th key={head} className="border-b p-3 text-left text-xs font-semibold"
                style={{borderColor: "#e5e7eb",backgroundColor: "#f3f4f6", color: "#374151"}}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={3} className="p-4 text-center" style={{ color: "#6b7280" }}>
                No data available
              </td>
            </tr>
          ) : (
            data.map(({ name, strValue }) => (
              <tr key={name} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td className="p-3 overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: "#111827" }} title={name}>
                  {name.length > 20 ? name.substring(0, 20) + '...' : name}
                </td>
                <td className="p-3" style={{ color: "#374151" }}>
                  {strValue}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default List;