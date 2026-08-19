SELECT "Player_ID", "Player_Name", "Player_Email", "Player_Username",
       CASE WHEN "Player_Password_Hash" IS NOT NULL THEN 'yes' ELSE 'no' END AS has_password
FROM public."Players"
ORDER BY "Player_ID"
LIMIT 20;
