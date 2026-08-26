import psycopg2
from config import config

def open_db_connection():
    try:
        # read connection parameters
        params1 = config()

        # connect to the PostgreSQL server
        conn1 = psycopg2.connect(**params1)
        return conn1
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
	
def open_db_cursor(conn1):
    try:
        # create a cursor
        return conn1.cursor()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def db_call_with_commit(conn1, cur1, the_query, the_query_parms="None"):
    try:
        # Run Query
        if the_query_parms == "None":
            return cur1.execute(the_query)
        else:	
            return cur1.execute(the_query, the_query_parms)
        conn1.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def db_call_with_no_commit(cur1, the_query, the_query_parms="None"):
    try:
        # Run Query
        if the_query_parms == "None":
             return cur1.execute(the_query)
        else:
             return cur1.execute(the_query, the_query_parms)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def close_db_cursor(cur1):
    try:
        cur1.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def close_db_connection(conn1):
    try:
        conn1.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
