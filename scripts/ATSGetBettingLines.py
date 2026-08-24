import requests
import psycopg2
from datetime import datetime
from config import config

def connect1(upsert_query, record_to_insert):
    conn1 = None
    try:
        # read connection parameters
        params1 = config()

        # connect to the PostgreSQL server
        conn1 = psycopg2.connect(**params1)
		
        # create a cursor
        cur1 = conn1.cursor()
        
        # Run Query
        cur1.execute(upsert_query, record_to_insert)
        conn1.commit()

	# close the communication with the PostgreSQL
        cur1.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn1 is not None:
            conn1.close()


# Record RunTimeof this Report
dateTimeObj = datetime.now()
dateString  = str(dateTimeObj.year) + "-" + dateTimeObj.strftime('%m') + "-" + dateTimeObj.strftime('%d')


# Connect to the PostgreSQL database server
conn2 = None
try:
    # read connection parameters
    params2 = config()

    # connect to the PostgreSQL server
    conn2 = psycopg2.connect(**params2)
		
    # create a cursor
    cur2 = conn2.cursor()


    print("******")
    print("*** 	Call Database to get weekof Game ***")
    print("******")

    # Run Query for games of the week
    TheQuery = """SELECT "WeekNumber", "Year", "WeekStartDateTime", "WeekEndDateTime" from "EventWeeks" where "WeekStartDateTime"<='""" + dateString + """' AND '""" + dateString + """' <= "WeekEndDateTime" """
    print(TheQuery)
    TheResults = cur2.execute(TheQuery)
    for TheResult in cur2:
        theWeek=str(TheResult[0])
        theYear=TheResult[1]
        theStartDate=str(TheResult[2])
        theEndDate=str(TheResult[3])
    theWeekStr  = "Week" + theWeek
    print(theWeek)
    print(theYear)
    print(theWeekStr)
    print(theStartDate)
    print(theEndDate)
    theStartDate = theStartDate.replace(" ", "T")
    theStartDate = theStartDate + "Z"
    theEndDate = theEndDate.replace(" ", "T")
    theEndDate = theEndDate + "Z"
    print(theStartDate)
    print(theEndDate)
    print(" ")
    print(" ")
    # close the communication with the PostgreSQL
    cur2.close()
except (Exception, psycopg2.DatabaseError) as error:
    print(error)
finally:
    if conn2 is not None:
        conn2.close()      



# Set Parameters for Sports Data API Calls
API_KEY = '2cf4c67a8d99f73b7d64d01274f99ec4'
SPORT = 'americanfootball_ncaaf'
REGIONS = 'us'
MARKETS = 'spreads,totals' # h2h | spreads | totals. Multiple can be specified if comma delimited
BOOKMAKERS = 'draftkings'  #  williamhill_us  |  draftkings  | fanduel  |   betonlineag  |  betmgm  |  betrivers  |  lowvig
ODDS_FORMAT = 'decimal'     # decimal | american
DATE_FORMAT = 'iso' # iso | unix

# Let us get Games of the week
sports_response = requests.get(
    'https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/events', 
    params={
        'api_key': API_KEY,
        'sport': 'americanfootball_ncaaf',
        'commenceTimeFrom': theStartDate,
        'commenceTimeTo':   theEndDate
    }
)
print("******")
print("*** 	Get Games for the Week ***")
print("******")
print("")
print("")

# Let us put Games of the week into the database
if sports_response.status_code != 200:
    print(f'Failed to get sports: status_code {sports_response.status_code}, response body {sports_response.text}')
    exit()
else:
    #print('List of in season sports:', sports_response.json())
    for games in sports_response.json():
        gameid=games.get("id")
        gamedate=games.get("commence_time")
        awayteam=games.get("away_team")
        hometeam=games.get("home_team")
        #print('When: ' + gamedate + '   AwayTeam: ' + awayteam + '   HomeTeam: ' + hometeam + '   ID: ' + gameid)
        
        upsert_query = """INSERT INTO "Events" ("Game_ID", "FK_Week", "Home_Team_Name", "Away_Team_Name", "Game_Start_Time") VALUES (%s, %s, %s, %s, %s) ON CONFLICT ("Game_ID") DO UPDATE SET "FK_Week"=%s, "Home_Team_Name"=%s, "Away_Team_Name"=%s, "Game_Start_Time"=%s """
        record_to_insert = (gameid, theWeek, hometeam, awayteam, gamedate, theWeek, hometeam, awayteam, gamedate) 
        connect1(upsert_query, record_to_insert)

    upsert_query = """update "Events" set "Game_Start_Time" = "Game_Start_Time" - interval '4:00' where "FK_Week" = %s  """
    record_to_insert = (theWeek)
    connect1(upsert_query, record_to_insert)


print("******")
print("*** 	Get Betting Lines for the Week ***")
print("******")
print("")
print("")

# Now let us get ATS and Over/Under for each game/event
odds_response = requests.get(
    'https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds', 
    params={
        'api_key': API_KEY,
        'sport': 'americanfootball_ncaaf',
        'regions': REGIONS,
        'markets': MARKETS,
        'bookmakers': BOOKMAKERS,
        'commenceTimeFrom': theStartDate,
        'commenceTimeTo':   theEndDate
    }
)

if odds_response.status_code != 200:
    print(f'Failed to get odds: status_code {odds_response.status_code}, response body {odds_response.text}')

else:
    odds_json = odds_response.json()
    for odds in odds_response.json():
        TheHomeTeam=odds.get("home_team")
        TheID=odds.get("id")
        bookmakers=odds.get("bookmakers")
        for bms in bookmakers:
            markets=bms.get("markets")
            for market in markets:
                marketkey=market.get("key")
                if marketkey == "spreads":
                    outcomes=market.get("outcomes")
                    for outcome in outcomes:
                        teamname=outcome.get("name")
                        points=outcome.get("point")
                        print(TheID)
                        print(points)
                        print("******")
                        if TheHomeTeam == teamname:
                            upsert_query = """update "Events" Set "Home_Team_ATS"=%s where "Game_ID"=%s """
                            record_to_insert = (points,TheID) 
                            connect1(upsert_query, record_to_insert)
                        else:
                            upsert_query = """update "Events" Set "Away_Team_ATS"=%s where "Game_ID"=%s """
                            record_to_insert = (points,TheID) 
                            connect1(upsert_query, record_to_insert)                

    # Check the usage quota
    print('Number of events:', len(odds_json))
    print('Remaining requests', odds_response.headers['x-requests-remaining'])
    print('Used requests', odds_response.headers['x-requests-used'])


print("******")
print("******")
print("******")
print("************PROGRAM COMPLETE*************")
print("******")
print("******")
print("******")

