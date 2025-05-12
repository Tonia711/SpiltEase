import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import api from "../utils/api";
import styles from "../styles/GroupSummary.module.css";

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

// Default data for when the API hasn't returned yet or errors out
const DEFAULT_SUMMARY_DATA = {
  totalExpenses: 0,
  billCount: 0,
  memberCount: 0,
  groupSummary: [],
  userSummary: [],
  categoryBreakdown: {},
  memberContributions: {}
};

// Component to display when there's no data
const NoDataMessage = ({ type }) => {
  const messages = {
    group: "No expenses yet! Time to start splitting some bills! 🎉",
    user: "You haven't added any expenses yet. Ready to join the fun? 💰"
  };

  return (
    <div className={styles.noDataMessage}>
      <p>{messages[type]}</p>
    </div>
  );
};

export default function GroupSummary({ groupId, group, groupIconUrl }) {
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [groupTotal, setGroupTotal] = useState(0);
  const [userTotal, setUserTotal] = useState(0);

  // Fetch summary data
  useEffect(() => {
    if (groupId) {
      setSummaryLoading(true);
      setSummaryError(null);

      api.get(`/groups/${groupId}/summary`)
        .then(({ data }) => {
          console.log("Received summary data:", data);
          setSummaryData(data || DEFAULT_SUMMARY_DATA);
          setGroupTotal(parseFloat(data?.groupTotal || 0));
          setUserTotal(parseFloat(data?.userTotal || 0));
          setSummaryLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch summary data:", err);
          setSummaryError("Failed to load expense summary data.");
          setSummaryLoading(false);

          setSummaryData(DEFAULT_SUMMARY_DATA);
          setGroupTotal(0);
          setUserTotal(0);
        });
    }
  }, [groupId]);

  // Prepare pie chart data for group summary
  const prepareCategoryChartData = () => {
    if (summaryData?.groupSummary && summaryData.groupSummary.length > 0) {
      return {
        labels: summaryData.groupSummary.map(item => item.labelName),
        datasets: [
          {
            data: summaryData.groupSummary.map(item => item.totalExpense),
            backgroundColor: summaryData.groupSummary.map((_, index) =>
              CHART_COLORS[index % CHART_COLORS.length]),
            borderWidth: 0,
          }
        ]
      };
    }

    if (summaryData?.categoryBreakdown && Object.keys(summaryData.categoryBreakdown).length > 0) {
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
            borderWidth: 0,
          },
        ],
      };
    }

    return {
      labels: ['No Categories'],
      datasets: [
        {
          data: [0],
          backgroundColor: ['#808080'],
          borderWidth: 0,
        },
      ],
    };
  };

  // Prepare member contribution chart data
  const prepareMemberChartData = () => {
    if (summaryData?.userSummary && summaryData.userSummary.length > 0) {
      return {
        labels: summaryData.userSummary.map(item => item.labelName),
        datasets: [
          {
            data: summaryData.userSummary.map(item => item.userExpense),
            backgroundColor: summaryData.userSummary.map((_, index) =>
              CHART_COLORS[index % CHART_COLORS.length]),
            borderWidth: 0,
          }
        ]
      };
    }

    if (summaryData?.memberContributions && Object.keys(summaryData.memberContributions).length > 0) {
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
            borderWidth: 0,
          },
        ],
      };
    }

    return {
      labels: ['No Data'],
      datasets: [
        {
          data: [0],
          backgroundColor: ['#808080'],
          borderWidth: 0,
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
          },
          color: '#fff'
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
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

  const categoryChartData = prepareCategoryChartData();
  const memberChartData = prepareMemberChartData();

  const calculateTotal = (data) => {
    if (!data || !data.datasets || !data.datasets[0] || !data.datasets[0].data) {
      return 0;
    }
    return data.datasets[0].data.reduce((sum, val) => sum + (val || 0), 0);
  };

  const calculatedGroupTotal = calculateTotal(categoryChartData);
  const calculatedUserTotal = calculateTotal(memberChartData);

  const displayGroupTotal = groupTotal || calculatedGroupTotal;
  const displayUserTotal = userTotal || calculatedUserTotal;

  // Helper function to check if we have valid data for charts
  const hasValidChartData = (data) => {
    if (!data) return false;
    if (data.labels?.length > 0 && data.datasets?.[0]?.data?.some(val => val > 0)) return true;
    return false;
  };

  const hasGroupData = hasValidChartData(categoryChartData);
  const hasUserData = hasValidChartData(memberChartData);

  return (
    <div className={styles.summaryContainer}>
      {summaryLoading ? (
        <p className={styles.loading}>Loading summary data...</p>
      ) : summaryError ? (
        <p className={styles.error}>{summaryError}</p>
      ) : (
        <>
          <div className={styles.chartSection}>
            <h3>Group Summary</h3>
            {hasGroupData ? (
              <>
                <div className={styles.summaryHeader}>
                  <span className={styles.summaryTitle}>Total</span>
                  <span className={styles.summaryAmount}>
                    ${displayGroupTotal.toFixed(2)}
                  </span>
                </div>
                <div className={styles.chartContainer}>
                  <Pie data={categoryChartData} options={chartOptions} />
                </div>
                {summaryData?.groupSummary && summaryData.groupSummary.length > 0 && (
                  <ul className={styles.labelList}>
                    {summaryData.groupSummary.map((item, index) => (
                      <li key={index} className={styles.labelItem}>
                        <div className={styles.labelName}>
                          <div
                            className={styles.labelColor}
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          ></div>
                          {item.labelName}
                        </div>
                        <div className={styles.labelAmount}>
                          ${item.totalExpense.toFixed(2)}
                          <span className={styles.labelPercentage}>
                            {displayGroupTotal > 0 ? `(${Math.round((item.totalExpense / displayGroupTotal) * 100)}%)` : '(0%)'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <NoDataMessage type="group" />
            )}
          </div>

          <div className={styles.chartSection}>
            <h3>My Summary</h3>
            {hasUserData ? (
              <>
                <div className={styles.summaryHeader}>
                  <span className={styles.summaryTitle}>Total</span>
                  <span className={styles.summaryAmount}>
                    ${displayUserTotal.toFixed(2)}
                  </span>
                </div>
                <div className={styles.chartContainer}>
                  <Pie data={memberChartData} options={chartOptions} />
                </div>
                {summaryData?.userSummary && summaryData.userSummary.length > 0 && (
                  <ul className={styles.labelList}>
                    {summaryData.userSummary.map((item, index) => (
                      <li key={index} className={styles.labelItem}>
                        <div className={styles.labelName}>
                          <div
                            className={styles.labelColor}
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          ></div>
                          {item.labelName}
                        </div>
                        <div className={styles.labelAmount}>
                          ${item.userExpense.toFixed(2)}
                          <span className={styles.labelPercentage}>
                            {displayUserTotal > 0 ? `(${Math.round((item.userExpense / displayUserTotal) * 100)}%)` : '(0%)'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <NoDataMessage type="user" />
            )}
          </div>
        </>
      )}
    </div>
  );
}