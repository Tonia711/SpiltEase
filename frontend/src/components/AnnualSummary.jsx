import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import styles from '../styles/AnnualSummary.module.css';
import MobileFrame from './MobileFrame';

const AnnualSummary = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get(`/users/me/annual-summary?year=${year}`)
      .then(({ data }) => {
        setSummaryData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch annual summary:', err);
        setError('Could not load your annual summary. Please try again.');
        setLoading(false);
      });
  }, [year]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleYearChange = (increment) => {
    setYear(prevYear => prevYear + increment);
  };

  return (
    <MobileFrame>
      <div className={styles.summaryContainer}>
        <div className={styles.header}>
          <button 
            className={styles.backButton} 
            onClick={() => navigate('/profile')}
          >
            {"<"}
          </button>
          <h1 className={styles.title}>Annual Report</h1>
        </div>

        <div className={styles.yearSelector}>
          <button 
            className={styles.yearButton}
            onClick={() => handleYearChange(-1)}
          >
            {"<"}
          </button>
          <span className={styles.currentYear}>{year}</span>
          <button 
            className={styles.yearButton}
            onClick={() => handleYearChange(1)}
            disabled={year >= currentYear}
          >
            {">"}
          </button>
        </div>

        {loading ? (
          <p className={styles.loading}>Loading your annual summary...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : summaryData ? (
          <>
            {summaryData.groupsCount === 0 ? (
              <p className={styles.emptyMessage}>
                You haven't joined any groups in {year}. Join a group to start tracking expenses!
              </p>
            ) : (
              <>
                <div className={styles.cardRow}>
                  <div className={styles.cardHalf}>
                    <h3 className={styles.cardTitle}>Bills Created</h3>
                    <p className={styles.cardValue}>{summaryData.totalBillsCreated}</p>
                    <p className={styles.subValue}>across {summaryData.groupsCount} groups</p>
                  </div>
                  <div className={styles.cardHalf}>
                    <h3 className={styles.cardTitle}>Personal Expense</h3>
                    <p className={styles.cardValue}>
                      {formatCurrency(summaryData.totalPersonalExpense)}
                    </p>
                  </div>
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Payment Summary</h3>
                  <p className={styles.cardValue}>
                    {formatCurrency(summaryData.totalPaidForOthers)}
                  </p>
                  <p className={styles.subValue}>paid for others</p>
                  <p className={styles.cardValue} style={{ marginTop: '1rem' }}>
                    {formatCurrency(summaryData.totalPaidByOthers)}
                  </p>
                  <p className={styles.subValue}>paid by others for you</p>
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Frequent Partners</h3>
                  {summaryData.frequentPartners.length > 0 ? (
                    <ul className={styles.partnersList}>
                      {summaryData.frequentPartners.map((partner, index) => (
                        <li key={index} className={styles.partnerItem}>
                          <span className={styles.partnerName}>{partner.name}</span>
                          <span className={styles.partnerCount}>
                            {partner.count} {partner.count === 1 ? 'bill' : 'bills'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.emptyMessage}>No frequent partners found.</p>
                  )}
                </div>

                {summaryData.mostExpensiveBill && (
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Most Expensive Bill</h3>
                    <p className={styles.cardValue}>
                      {formatCurrency(summaryData.mostExpensiveBill.amount)}
                    </p>
                    <div className={styles.expensiveBillDetails}>
                      <div className={styles.expensiveBillDetail}>
                        <span className={styles.detailLabel}>Group</span>
                        <span className={styles.detailValue}>{summaryData.mostExpensiveBill.groupName}</span>
                      </div>
                      <div className={styles.expensiveBillDetail}>
                        <span className={styles.detailLabel}>Note</span>
                        <span className={styles.detailValue}>{summaryData.mostExpensiveBill.note}</span>
                      </div>
                      <div className={styles.expensiveBillDetail}>
                        <span className={styles.detailLabel}>Date</span>
                        <span className={styles.detailValue}>
                          {formatDate(summaryData.mostExpensiveBill.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <p className={styles.emptyMessage}>No summary data available.</p>
        )}
      </div>
    </MobileFrame>
  );
};

export default AnnualSummary;