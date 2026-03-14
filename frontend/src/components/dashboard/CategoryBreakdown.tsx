'use client';

interface CategoryScore {
  category: string;
  safety: number;
  helpfulness: number;
  policy_consistency: number;
  count: number;
}

interface CategoryBreakdownProps {
  data: CategoryScore[];
}

export default function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  if (!data.length) return <div className="text-gray-400 text-sm">No data yet.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-4">Category</th>
            <th className="py-2 pr-4">Safety</th>
            <th className="py-2 pr-4">Helpfulness</th>
            <th className="py-2 pr-4">Policy</th>
            <th className="py-2">Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.category} className="border-b hover:bg-gray-50">
              <td className="py-2 pr-4 font-medium capitalize">{row.category.replace('_', ' ')}</td>
              <td className="py-2 pr-4">{(row.safety * 100).toFixed(0)}%</td>
              <td className="py-2 pr-4">{(row.helpfulness * 100).toFixed(0)}%</td>
              <td className="py-2 pr-4">{(row.policy_consistency * 100).toFixed(0)}%</td>
              <td className="py-2">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
