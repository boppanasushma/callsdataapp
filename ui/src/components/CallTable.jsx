import React, { useState, useMemo, useEffect } from "react";
import "./CallTable.css";

const formatTimestamp = (timestamp) => {
  try {
    let date;
    const timestampStr = timestamp.toString();

    // Handle different timestamp formats
    if (timestampStr.length === 13) {
      // Already in milliseconds
      date = new Date(parseInt(timestampStr));
    } else if (timestampStr.length === 10) {
      // Convert seconds to milliseconds
      date = new Date(parseInt(timestampStr) * 1000);
    } else {
      // Try direct parsing
      date = new Date(timestamp);
    }

    // Validate date
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    // Use a more basic date formatting approach
    const options = {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    };

    return date.toLocaleString("en-US", options);
  } catch (error) {
    return "Invalid Date";
  }
};

// Add this debug function to check the data
const debugCallData = (call) => {
  console.log("Call data:", {
    start: {
      original: call.call_start_time,
      type: typeof call.call_start_time,
      length: call.call_start_time?.toString().length,
    },
    end: {
      original: call.call_end_time,
      type: typeof call.call_end_time,
      length: call.call_end_time?.toString().length,
    },
  });
};

const CallTable = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [selectedAPI, setSelectedAPI] = useState("calls_data");
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(100);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        setLoading(true);
        setError(null);
        setCalls([]);

        // Build query parameters
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);
        if (selectedAgent) params.append("agent_id", selectedAgent);
        if (selectedStatus) params.append("status", selectedStatus);
        if (selectedOutcome) params.append("outcome", selectedOutcome);

        const apiUrl = `http://${
          window.location.hostname
        }:5004/${selectedAPI}?${params.toString()}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch data from ${selectedAPI}`);
        }

        const data = await response.json();
        setCalls(data);
      } catch (err) {
        setError(err.message);
        setCalls([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, [
    selectedAPI,
    startDate,
    endDate,
    selectedAgent,
    selectedStatus,
    selectedOutcome,
  ]);

  // Debug the incoming data
  useEffect(() => {
    if (calls.length > 0) {
      console.log("First call data:", calls[0]);
      debugCallData(calls[0]);
    }
  }, [calls]);

  const uniqueAgents = useMemo(() => {
    const agents = [
      ...new Set(calls.map((call) => call.agent_id?.toString().trim())),
    ];
    return agents.filter(Boolean).sort();
  }, [calls]);

  const uniqueStatuses = useMemo(() => {
    const statuses = [
      ...new Set(
        calls.map((call) => call.call_status?.toString().trim().toLowerCase())
      ),
    ];
    return statuses.filter(Boolean).sort();
  }, [calls]);

  const uniqueOutcomes = useMemo(() => {
    const outcomes = [
      ...new Set(
        calls.map((call) => call.call_outcome?.toString().trim().toLowerCase())
      ),
    ];
    return outcomes.filter(Boolean).sort();
  }, [calls]);

  const clearAllFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedAgent("");
    setSelectedStatus("");
    setSelectedOutcome("");
    setCurrentPage(1);
  };

  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      // Filter by agent
      if (selectedAgent && call.agent_id?.toString() !== selectedAgent) {
        return false;
      }
      // Filter by status
      if (
        selectedStatus &&
        call.call_status?.toString().toLowerCase() !==
          selectedStatus.toLowerCase()
      ) {
        return false;
      }
      // Filter by outcome
      if (
        selectedOutcome &&
        call.call_outcome?.toString().toLowerCase() !==
          selectedOutcome.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [calls, selectedAgent, selectedStatus, selectedOutcome]);

  const paginatedCalls = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredCalls.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredCalls, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredCalls.length / rowsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Modify the filter handlers to reset pagination
  const handleFilterChange = {
    agent: (value) => {
      setSelectedAgent(value);
      setCurrentPage(1); // Reset to first page
    },
    status: (value) => {
      setSelectedStatus(value);
      setCurrentPage(1); // Reset to first page
    },
    outcome: (value) => {
      setSelectedOutcome(value);
      setCurrentPage(1); // Reset to first page
    },
    api: (value) => {
      setSelectedAPI(value);
      setCurrentPage(1); // Reset to first page
    },
    startDate: (value) => {
      setStartDate(value);
      setCurrentPage(1); // Reset to first page
    },
    endDate: (value) => {
      setEndDate(value);
      setCurrentPage(1); // Reset to first page
    },
  };

  return (
    <div className="table-container">
      <div className="filter-section">
        <div className="filters-container">
          <div className="api-filter">
            <div className="filter-item">
              <label htmlFor="api">Data Source:</label>
              <select
                id="api"
                value={selectedAPI}
                onChange={(e) => handleFilterChange.api(e.target.value)}
              >
                <option value="calls_data">Local Data</option>
                <option value="calls_data_pinot">Pinot Data</option>
              </select>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="date-filter">
            <div className="filter-item">
              <label htmlFor="start-date">Start Date:</label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => handleFilterChange.startDate(e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label htmlFor="end-date">End Date:</label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => handleFilterChange.endDate(e.target.value)}
              />
            </div>
          </div>

          <div className="agent-filter">
            <div className="filter-item">
              <label htmlFor="agent">Agent:</label>
              <select
                id="agent"
                value={selectedAgent}
                onChange={(e) => handleFilterChange.agent(e.target.value)}
              >
                <option value="">All Agents</option>
                {uniqueAgents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="status-filter">
            <div className="filter-item">
              <label htmlFor="status">Status:</label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => handleFilterChange.status(e.target.value)}
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="outcome-filter">
            <div className="filter-item">
              <label htmlFor="outcome">Outcome:</label>
              <select
                id="outcome"
                value={selectedOutcome}
                onChange={(e) => handleFilterChange.outcome(e.target.value)}
              >
                <option value="">All Outcomes</option>
                {uniqueOutcomes.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="clear-filter" onClick={clearAllFilters}>
            Clear All Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading calls data...</div>
      ) : error ? (
        <div className="error-state">
          <p>Failed to load data from {selectedAPI}</p>
          <p>Please try another data source or refresh the page</p>
        </div>
      ) : (
        <>
          <div className="row-count">
            Showing {paginatedCalls.length} of {filteredCalls.length} row(s)
          </div>
          <table className="call-table">
            <thead>
              <tr>
                <th>Row ID</th>
                <th>Call ID</th>
                <th>Agent ID</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th>Department ID</th>
                <th>Company ID</th>
                <th>Status</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCalls.length > 0 ? (
                paginatedCalls.map((call) => (
                  <tr key={call.row_id}>
                    <td>{call.row_id}</td>
                    <td>{call.call_id}</td>
                    <td>{call.agent_id}</td>
                    <td>{formatTimestamp(call.call_start_time)}</td>
                    <td>{formatTimestamp(call.call_end_time)}</td>
                    <td>{call.duration}</td>
                    <td>{call.department_id}</td>
                    <td>{call.company_id}</td>
                    <td>{call.call_status}</td>
                    <td>{call.call_outcome}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-data">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredCalls.length > 0 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => handlePageChange(index + 1)}
                  className={currentPage === index + 1 ? "active" : ""}
                >
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CallTable;
