import type {
  ChampionByPlayerRow,
  ChampionByYearRow,
} from "@/lib/champions";

function groupConsecutive<T>(rows: T[], keyOf: (row: T) => string) {
  const groups: { key: string; rows: T[] }[] = [];
  for (const row of rows) {
    const key = keyOf(row);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.rows.push(row);
    } else {
      groups.push({ key, rows: [row] });
    }
  }
  return groups;
}

export function ChampionsClient({
  byYear,
  byPlayer,
  error,
}: {
  byYear: ChampionByYearRow[];
  byPlayer: ChampionByPlayerRow[];
  error?: string | null;
}) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
        {error}
      </div>
    );
  }

  const yearGroups = groupConsecutive(byYear, (row) => String(row.Year));
  const playerGroups = groupConsecutive(byPlayer, (row) => row.Name);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Champions</h1>
        <p className="mt-1 text-sm text-slate-400">
          Historical pool winners by year and by player.
        </p>
      </div>
      <div className="grid gap-8 xl:grid-cols-2 xl:items-start">
        <GroupedTable
          title="Historical Winners by Year"
          empty="No yearly winners recorded."
          columns={["Year", "Place", "Winners"]}
          compact
          groups={yearGroups.map((g) => ({
            key: g.key,
            cells: g.rows.map((row) => [
              String(row.Year),
              row.Rank,
              row.Winners || "—",
            ]),
          }))}
        />
        <GroupedTable
          title="Historical Winners by Player"
          empty="No player winners recorded."
          columns={["Name", "Year", "Place"]}
          compact
          groups={playerGroups.map((g) => ({
            key: g.key,
            cells: g.rows.map((row) => [
              row.Name,
              String(row.Year),
              row.Rank,
            ]),
          }))}
        />
      </div>
    </div>
  );
}

function GroupedTable({
  title,
  empty,
  columns,
  groups,
  compact = false,
}: {
  title: string;
  empty: string;
  columns: [string, string, string];
  groups: { key: string; cells: string[][] }[];
  compact?: boolean;
}) {
  const cellPad = compact ? "px-2 py-1.5" : "px-3 py-1.5";
  const headPad = compact ? "px-2 py-2" : "px-3 py-2";

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div
        className={`overflow-x-auto rounded-xl border border-slate-700 ${
          compact ? "w-fit max-w-full" : ""
        }`}
      >
        <table
          className={`border-collapse border border-slate-700 text-left text-xs sm:text-sm ${
            compact ? "w-auto table-auto" : "min-w-full"
          }`}
        >
          <thead>
            <tr className="bg-slate-900/90">
              {columns.map((col) => (
                <th
                  key={col}
                  className={`whitespace-nowrap border border-slate-700 ${headPad} font-medium text-slate-200 ${
                    compact ? "w-px" : ""
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="border border-slate-700 px-3 py-3 text-slate-400"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              groups.flatMap((group) =>
                group.cells.map((cells, i) => (
                  <tr key={`${group.key}-${i}`}>
                    {i === 0 ? (
                      <td
                        rowSpan={group.cells.length}
                        className={`align-top whitespace-nowrap border border-slate-700 bg-pool-navy ${cellPad} font-medium text-slate-100 ${
                          compact ? "w-px" : ""
                        }`}
                      >
                        {cells[0]}
                      </td>
                    ) : null}
                    <td
                      className={`align-top whitespace-nowrap border border-slate-700 ${cellPad} text-slate-200 ${
                        compact ? "w-px" : ""
                      }`}
                    >
                      {cells[1]}
                    </td>
                    <td
                      className={`align-top whitespace-nowrap border border-slate-700 ${cellPad} text-slate-300 ${
                        compact ? "w-px" : ""
                      }`}
                    >
                      {cells[2]}
                    </td>
                  </tr>
                )),
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
