import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MobileFrame from "../components/MobileFrame";
import api from "../utils/api";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import styles from "../styles/GroupSummaryPage.module.css";

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

export default function GroupSummaryPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [groupIconUrl, setGroupIconUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

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

  // Fetch summary data
  useEffect(() => {
    if (groupId) {
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
  }, [groupId]);

  // Prepare pie chart data for group summary
  const prepareCategoryChartData = () => {
    if (!summaryData || !summaryData.categoryBreakdown) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderWidth: 1,
          },
        ],
      };
    }

    const labels = [];
    const data = [];
    const backgroundColors = [];

    Object.entries(summaryData.categoryBreakdown).forEach(([category, amount], index) => {
      labels.push(category);
      data.push(amount);
      backgroundColors.push(CHART_COLORS[index % CHART_COLORS.length]);
    });

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare member contribution chart data
  const prepareMemberChartData = () => {
    if (!summaryData || !summaryData.memberContributions) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderWidth: 1,
          },
        ],
      };
    }

    const labels = [];
    const data = [];
    const backgroundColors = [];

    Object.entries(summaryData.memberContributions).forEach(([member, amount], index) => {
      labels.push(member);
      data.push(amount);
      backgroundColors.push(CHART_COLORS[index % CHART_COLORS.length]);
    });

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: $${value.toFixed(2)}`;
          }
        }
      }
    }
  };

  const handleBackClick = () => {
    navigate(`/groups/${groupId}/expenses`);
  };
  
  const handleGroupIconClick = () => {
    navigate(`/groups/${groupId}`); // 点头像跳 GroupDetailPage
  };

  if (loading) {
    return (
      <MobileFrame>
        <div className={styles.loadingContainer}>
          <p>Loading group data...</p>
        </div>
      </MobileFrame>
    );
  }

  if (error) {
    return (
      <MobileFrame>
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={handleBackClick} className={styles.backButton}>
            Back to Expenses
          </button>
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleBackClick} className={styles.backButton}>
            &larr;
          </button>
          <div className={styles.groupInfo}>
            {groupIconUrl && (
              <img 
                src={groupIconUrl} 
                alt="Group Icon" 
                className={styles.groupIcon} 
                onClick={handleGroupIconClick}
              />
            )}
            <h2 className={styles.groupName}>{group?.groupName} Summary</h2>
          </div>
        </div>

        <div className={styles.summaryContainer}>
          {summaryLoading ? (
            <p>Loading summary data...</p>
          ) : summaryError ? (
            <p className={styles.error}>{summaryError}</p>
          ) : summaryData ? (
            <>
              <div className={styles.overviewSection}>
                <h3>Group Overview</h3>
                <div className={styles.overviewStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Total Expenses</span>
                    <span className={styles.statValue}>${summaryData.totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Bill Count</span>
                    <span className={styles.statValue}>{summaryData.billCount}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Members</span>
                    <span className={styles.statValue}>{summaryData.memberCount}</span>
                  </div>
                </div>
              </div>

              <div className={styles.chartSection}>
                <h3>Expenses by Category</h3>
                <div className={styles.chartContainer}>
                  <Pie data={prepareCategoryChartData()} options={chartOptions} />
                </div>
              </div>

              <div className={styles.chartSection}>
                <h3>Member Contributions</h3>
                <div className={styles.chartContainer}>
                  <Pie data={prepareMemberChartData()} options={chartOptions} />
                </div>
              </div>

              <div className={styles.balancesSection}>
                <h3>Current Balances</h3>
                <div className={styles.balancesList}>
                  {summaryData.balances && Object.entries(summaryData.balances).map(([member, balance], index) => (
                    <div key={index} className={styles.balanceItem}>
                      <span className={styles.memberName}>{member}</span>
                      <span className={`${styles.balanceAmount} ${balance >= 0 ? styles.positive : styles.negative}`}>
                        {balance >= 0 ? `+$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {summaryData.settleUpSuggestions && summaryData.settleUpSuggestions.length > 0 && (
                <div className={styles.settleUpSection}>
                  <h3>Settle Up Suggestions</h3>
                  <div className={styles.suggestionsList}>
                    {summaryData.settleUpSuggestions.map((suggestion, index) => (
                      <div key={index} className={styles.suggestionItem}>
                        <p>
                          <span className={styles.fromMember}>{suggestion.from}</span> should pay{" "}
                          <span className={styles.toMember}>{suggestion.to}</span>{" "}
                          <span className={styles.paymentAmount}>${suggestion.amount.toFixed(2)}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className={styles.noDataMessage}>No summary data available.</p>
          )}
        </div>
      </div>
    </MobileFrame>
  );
}