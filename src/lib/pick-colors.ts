/** Color rules for Player Picks and All Picks (Result only). */
export function playerPickCellBackground(result: number | null): string {
  if (result == null) {
    return "white";
  }
  switch (result) {
    case 3:
      return "lawngreen";
    case 2:
      return "cyan";
    case 1:
      return "lightslategrey";
    case 0:
      return "yellow";
    case -1:
      return "pink";
    default:
      return "white";
  }
}
