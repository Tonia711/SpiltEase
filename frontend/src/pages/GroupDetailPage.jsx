import React, { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/GroupDetailPage.module.css";
import { AuthContext } from "../contexts/AuthContext";
import MobileFrame from "../components/MobileFrame";
import GroupExpenseComponent from "../components/GroupExpenseComponent";
import api from "../utils/api";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define chart colors
const CHART_COLORS = [
  "#8BC34A", // Light green
  "#9C27B0", // Purple
  "#673AB7", // Deep purple
  "#00BCD4", // Cyan
  "#FF5722", // Deep orange
  "#FF9800", // Orange
  "#FFEB3B", // Yellow
  "#4CAF50", // Green
  "#2196F3", // Blue
  "#3F51B5", // Indigo
];

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [groupIconUrl, setGroupIconUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [editedStartDate, setEditedStartDate] = useState("");
  
  // State variables for tabs, summary, and group info overlay
  const [activeTab, setActiveTab] = useState("expense");
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
    : "";
  const DEFAULT_ICON = `${BASE_URL}/groups/defaultIcon.jpg`;

  // Fetch group data
  useEffect(() => {
    api
      .get(`/groups/${groupId}`)
      .then(({ data }) => {
        setGroup(data);

        const iconUrl = data.iconUrl;
        const fullIconUrl = iconUrl
          ? (iconUrl.startsWith("http") ? iconUrl : `${BASE_URL}/${iconUrl}`)
          : DEFAULT_ICON;

        setGroupIconUrl(fullIconUrl);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch group data:", err);
        setError("Failed to load group data. Please try again.");
        setLoading(false);
      });
  }, [groupId, BASE_URL]);

  // Fetch summary data when active tab is "summary"
  useEffect(() => {
    if (activeTab === "summary" && groupId) {
      setSummaryLoading(true);
      setSummaryError(null);
      
      api.get(`/groups/${groupId}/summary`)
        .then(({ data }) => {
          setSummaryData(data);
          setSummaryLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch summary data:", err);
          setSummaryError("Failed to load expense summary data.");
          setSummaryLoading(false);
        });
    }
  }, [activeTab, groupId]);

  const handleGroupIconClick = () => {
    setShowGroupInfo(true);
  };

  const formatStartDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid Date";
    }
  };

  // Prepare pie chart data for group summary
  const prepareChartData = (data, isGroupSummary = true) => {
    if (!data) return null;
    
    const summaryArray = isGroupSummary ? data.groupSummary : data.userSummary;
    
    if (!summaryArray || summaryArray.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#808080"],
            borderWidth: 0,
          }
        ]
      };
    }
    
    return {
      labels: summaryArray.map(item => item.labelName),
      datasets: [
        {
          data: summaryArray.map(item => isGroupSummary ? item.totalExpense : item.userExpense),
          backgroundColor: summaryArray.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
          borderWidth: 0,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `$${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    elements: {
      arc: {
        borderWidth: 0,
      },
    },
  };

  if (loading) return <p className={styles.loading}>Loading group details...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!group) return <p className={styles.error}>No group data found.</p>;

  return (
    <MobileFrame>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            {"<"}
          </button>
          <img
            src={groupIconUrl}
            alt="Group Icon"
            className={styles.groupIcon}
            onClick={handleGroupIconClick}
            style={{ cursor: 'pointer' }}
          />

          <div className={styles.inviteCode}>
            Invite Code <span className={styles.codeValue}>{group.joinCode}</span>
          </div>
        </div>
        
        {/* Group Info Overlay - shows when clicking on group icon */}
        {showGroupInfo && (
          <div className={styles.groupInfoOverlay} onClick={() => setShowGroupInfo(false)}>
            <div className={styles.groupInfoContent} onClick={e => e.stopPropagation()}>
              <div className={styles.groupInfoHeader}>
                <h3>Group Information</h3>
                <button 
                  className={styles.closeButton} 
                  onClick={() => setShowGroupInfo(false)}
                >
                  ×
                </button>
              </div>

              <section className={styles.infoSection}>
                <label htmlFor="groupName" className={styles.label}>Group Name</label>
                <input
                  id="groupName"
                  type="text"
                  value={isEditing ? editedGroupName : group.groupName}
                  onChange={(e) => setEditedGroupName(e.target.value)}
                  readOnly={!isEditing}
                  className={`${styles.inputField} ${!isEditing ? styles.readOnly : ""}`}
                />
              </section>

              <section className={styles.infoSection}>
                <label htmlFor="startDate" className={styles.label}>Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  value={
                    isEditing
                      ? editedStartDate?.slice(0, 10)
                      : group.startDate?.slice(0, 10) || ""
                  }
                  onChange={(e) => setEditedStartDate(e.target.value)}
                  readOnly={!isEditing}
                  className={`${styles.inputField} ${!isEditing ? styles.readOnly : ""}`}
                />
              </section>

              <section className={styles.membersSection}>
                <h4 className={styles.membersTitle}>Members</h4>
                <div className={styles.membersListContainer}>
                  <ul className={styles.membersList}>
                    {(group.members || []).map((member) => (
                      <li key={member._id || member.userId || member.memberId} className={styles.memberItem}>
                        {member.userName || member.name || 'Unnamed'}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <button
                className={styles.editButton}
                onClick={() => {
                  if (!isEditing) {
                    setEditedGroupName(group.groupName || "");
                    setEditedStartDate(group.startDate || "");
                  } else {
                    // api.put(`/groups/${groupId}`, { groupName: editedGroupName, startDate: editedStartDate })
                  }
                  setIsEditing(!isEditing);
                }}
              >
                {isEditing ? "Save" : "Edit"}
              </button>
            </div>
          </div>
        )}
        
        {/* Tab navigation */}
        <div className={styles.tabNav}>
          <button 
            className={`${styles.tabButton} ${activeTab === "expense" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("expense")}
          >
            Expenses
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === "balance" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("balance")}
          >
            Balances
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === "summary" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            Summary
          </button>
        </div>
        
        {/* Expense Tab - Now using GroupExpenseComponent */}
        {activeTab === "expense" && (
          <GroupExpenseComponent groupId={groupId} />
        )}
        
        {/* Balance Tab */}
        {activeTab === "balance" && (
          <div className={styles.summarySection}>
            <p>Balance details will be implemented here.</p>
          </div>
        )}
        
        {/* Summary Tab */}
        {activeTab === "summary" && (
          <div className={styles.summarySection}>
            {summaryLoading ? (
              <p>Loading summary data...</p>
            ) : summaryError ? (
              <p className={styles.error}>{summaryError}</p>
            ) : summaryData ? (
              <div className={styles.summaryScrollContent}>
                {/* Group Summary Section */}
                <div className={styles.summaryHeader}>
                  <h3 className={styles.summaryTitle}>Group Summary</h3>
                  <span className={styles.summaryAmount}>$ {summaryData.groupTotal}</span>
                </div>
                
                <div className={styles.chartContainer}>
                  <Pie 
                    data={prepareChartData(summaryData, true)}
                    options={chartOptions}
                  />
                </div>
                
                <ul className={styles.labelList}>
                  {summaryData.groupSummary.map((item, index) => (
                    <li key={item.labelId} className={styles.labelItem}>
                      <div className={styles.labelName}>
                        <div 
                          className={styles.labelColor} 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        ></div>
                        <span>{item.labelName}</span>
                      </div>
                      <div className={styles.labelAmount}>
                        <span>$ {item.totalExpense}</span>
                        <span className={styles.labelPercentage}>{item.percentage}%</span>
                      </div>
                    </li>
                  ))}
                </ul>
                
                {/* User Summary Section */}
                <div className={styles.summaryHeader} style={{ marginTop: '2rem' }}>
                  <h3 className={styles.summaryTitle}>My Summary</h3>
                  <span className={styles.summaryAmount}>$ {summaryData.userTotal}</span>
                </div>
                
                <div className={styles.chartContainer}>
                  <Pie 
                    data={prepareChartData(summaryData, false)}
                    options={chartOptions}
                  />
                </div>
                
                <ul className={styles.labelList}>
                  {summaryData.userSummary.map((item, index) => (
                    <li key={item.labelId} className={styles.labelItem}>
                      <div className={styles.labelName}>
                        <div 
                          className={styles.labelColor} 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        ></div>
                        <span>{item.labelName}</span>
                      </div>
                      <div className={styles.labelAmount}>
                        <span>$ {item.userExpense}</span>
                        <span className={styles.labelPercentage}>{item.percentage}%</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No summary data available.</p>
            )}
          </div>
        )}
      </div>
    </MobileFrame>
  );
}
