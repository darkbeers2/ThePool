-- Site credential login columns for public."Players"
ALTER TABLE public."Players"
  ADD COLUMN IF NOT EXISTS "Player_Username" character varying,
  ADD COLUMN IF NOT EXISTS "Player_Password_Hash" character varying;

CREATE UNIQUE INDEX IF NOT EXISTS "Players_Player_Username_key"
  ON public."Players" ("Player_Username")
  WHERE "Player_Username" IS NOT NULL;
