import React, { useState, useEffect } from 'react';
import { getAllLeaveRequests } from '../../integration/leavesAPI';

const LeaveSummaryCards = ({ activePeriod }) => {
  const [summaryData, setSummaryData] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    today: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveSummary = async () => {
      try {
        setLoading(true);
        const response = await getAllLeaveRequests();
        const leaves = response.rows || [];

        // Count pending approvals - all pending leave requests (case-insensitive)
        const pendingCount = leaves.filter(leave => 
          leave.status && leave.status.toLowerCase() === 'pending'
        ).length;
        
        // Count approved leaves - all approved leave requests (case-insensitive)
        const approvedCount = leaves.filter(leave => 
          leave.status && leave.status.toLowerCase() === 'approved'
        ).length;
        
        // Count rejected leaves - all rejected leave requests (case-insensitive)
        const rejectedCount = leaves.filter(leave => 
          leave.status && leave.status.toLowerCase() === 'rejected'
        ).length;
        
        // Count leaves for the selected period (today or week) - all statuses included
        let periodLeavesCount = 0;
        if (activePeriod === 'today') {
          const today = new Date();
          today.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
          today.setHours(0, 0, 0, 0);
          
          periodLeavesCount = leaves.filter(leave => {
            const leaveDate = leave.start_date ? new Date(leave.start_date) : null;
            if (leaveDate) {
              leaveDate.setFullYear(leaveDate.getFullYear(), leaveDate.getMonth(), leaveDate.getDate());
              leaveDate.setHours(0, 0, 0, 0);
              return leaveDate.getTime() === today.getTime();
            }
            return false;
          }).length;
        } else if (activePeriod === 'week') {
          // For week, count leaves in the current week
          const today = new Date();
          const dayOfWeek = today.getDay();
          const startOfWeek = new Date(today);
          
          // Calculate start of week (Sunday = 0, Monday = 1, etc.)
          // Week starts on Monday: adjust accordingly
          const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days to Monday
          startOfWeek.setDate(today.getDate() + diff);
          startOfWeek.setHours(0, 0, 0, 0); // Reset time to start of day
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999); // Set time to end of day
          
          periodLeavesCount = leaves.filter(leave => {
            const leaveDate = leave.start_date ? new Date(leave.start_date) : null;
            if (leaveDate) {
              const leaveStart = new Date(leaveDate);
              leaveStart.setHours(0, 0, 0, 0);
              
              // For full day and half day leaves, use end_date; for hours permission, use same date
              const leaveEnd = leave.end_date ? new Date(leave.end_date) : leaveStart;
              leaveEnd.setHours(23, 59, 59, 999);
              
              // Check if there's an overlap between the leave period and the current week
              return leaveStart <= endOfWeek && leaveEnd >= startOfWeek;
            }
            return false;
          }).length;
        } else if (activePeriod === 'all') {
          // For 'all' period, count all leaves
          periodLeavesCount = leaves.length;
        } else {
          // For any other unrecognized periods, default to showing all leaves
          periodLeavesCount = leaves.length;
        }

        setSummaryData({
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          today: periodLeavesCount
        });
      } catch (error) {
        console.error('Error fetching leave summary:', error);
        // In case of error, set all counts to 0
        setSummaryData({
          pending: 0,
          approved: 0,
          rejected: 0,
          today: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveSummary();
  }, [activePeriod]);

  return (
    <div className="leave-summary-cards">
      <div className="summary-card">
        <div className="summary-count">{loading ? '--' : summaryData.pending}</div>
        <div className="summary-label">Pending Approvals</div>
      </div>
      <div className="summary-card">
        <div className="summary-count">{loading ? '--' : summaryData.approved}</div>
        <div className="summary-label">Approved Leaves</div>
      </div>
      <div className="summary-card">
        <div className="summary-count">{loading ? '--' : summaryData.rejected}</div>
        <div className="summary-label">Rejected Leaves</div>
      </div>
      <div className="summary-card">
        <div className="summary-count">{loading ? '--' : summaryData.today}</div>
        <div className="summary-label">{activePeriod === 'week' ? 'Week Leaves' : activePeriod === 'all' ? 'All Leaves' : 'Today Leaves'}</div>
      </div>
    </div>
  );
};

export default LeaveSummaryCards;