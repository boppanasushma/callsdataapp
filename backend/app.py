from flask import Flask, jsonify, request
from flask_cors import CORS
from data import calls_data
from pinotdb import connect
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


@app.route("/calls_data", methods=["GET"])
def get_calls_data():
    return jsonify(calls_data)


@app.route("/calls_data_pinot", methods=["GET"])
def get_calls_data_pinot():
    # Get query parameters
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    agent_id = request.args.get("agent_id")
    status = request.args.get("status")
    outcome = request.args.get("outcome")

    # Build WHERE clause dynamically
    where_conditions = []

    if start_date:
        # Convert date to timestamp in milliseconds (assuming start of day)
        start_timestamp = int(
            datetime.strptime(f"{start_date} 00:00:00", "%Y-%m-%d %H:%M:%S").timestamp()
            * 1000
        )
        where_conditions.append(
            f"timeConvert(call_start_time, 'MILLISECONDS', 'MILLISECONDS') >= {start_timestamp}"
        )

    if end_date:
        # Convert date to timestamp in milliseconds (assuming end of day)
        end_timestamp = int(
            datetime.strptime(f"{end_date} 23:59:59", "%Y-%m-%d %H:%M:%S").timestamp()
            * 1000
        )
        where_conditions.append(
            f"timeConvert(call_start_time, 'MILLISECONDS', 'MILLISECONDS') <= {end_timestamp}"
        )

    if agent_id:
        where_conditions.append(f"agent_id = '{agent_id}'")

    if status:
        where_conditions.append(f"call_status = '{status}'")

    if outcome:
        where_conditions.append(f"call_outcome = '{outcome}'")

    # Debug print
    print(
        "Query parameters:",
        {
            "start_date": start_date,
            "end_date": end_date,
            "start_timestamp": start_timestamp if start_date else None,
            "end_timestamp": end_timestamp if end_date else None,
        },
    )

    # Construct the WHERE clause
    where_clause = " AND ".join(where_conditions)

    # Build the complete query
    query = """
        SELECT
            row_id,
            call_id,
            agent_id,
            call_start_time,
            call_end_time,
            duration,
            department_id,
            company_id,
            call_status,
            call_outcome
        FROM call_analytics
        {where_condition}
        LIMIT 10000
    """.format(
        where_condition=f"WHERE {where_clause}" if where_conditions else ""
    )

    # Debug print
    print("Executing query:", query)

    # Connect to Pinot
    conn = connect(host="34.71.204.44", port=8099, path="/query/sql", scheme="http")
    cursor = conn.cursor()
    cursor.arraysize = 10000

    try:
        cursor.execute(query)
        raw_results = cursor.fetchall()

        columns = [
            "row_id",
            "call_id",
            "agent_id",
            "call_start_time",
            "call_end_time",
            "duration",
            "department_id",
            "company_id",
            "call_status",
            "call_outcome",
        ]

        formatted_results = [
            dict(zip(columns, row)) for row in raw_results if "null" not in row
        ]

        return jsonify(formatted_results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5004)
