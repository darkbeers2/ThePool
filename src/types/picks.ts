import type { PickSide } from "@/lib/player-picks-week";

export type EventRow = {
  Game_ID: string;
  FK_Week: number;
  Home_Team_Name: string;
  Away_Team_Name: string;
  Home_Team_ATS: string | null;
  Away_Team_ATS: string | null;
  Game_Start_Time: string;
};

export type MyPickRow = {
  FK_Game_ID: string;
  Home_Team_Name: string | null;
  Away_Team_Name: string | null;
  Home_Team_ATS: string | null;
  Away_Team_ATS: string | null;
  FK_Week: number;
  Is_Lock: boolean | null;
  Game_Start_Time: string;
  isStarted: boolean;
  side: PickSide | null;
};
