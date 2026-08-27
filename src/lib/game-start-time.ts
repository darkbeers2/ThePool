/** Events.Game_Start_Time is stored as Eastern wall clock (timestamp without time zone). */
export const GAME_START_TIME_ZONE = "America/New_York";

/** SQL expression: Game_Start_Time as timestamptz for comparison with NOW(). */
export const gameStartAtSql = `"Game_Start_Time" AT TIME ZONE '${GAME_START_TIME_ZONE}'`;

export const gameHasNotStartedSql = `(${gameStartAtSql}) > NOW()`;

export const gameHasStartedSql = `(${gameStartAtSql}) <= NOW()`;
