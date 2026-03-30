import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getUserLeaveBalanceSummary } from '../../integration/leavesAPI';
import useAuth from '../../hooks/useAuth'; // Default export
import './LeaveStats.css';

const LeavePieChart = ({ title, available, consumed }) => {
  const total = available + consumed;
  const data = [
    { name: 'Consumed', value: consumed, color: '#347E45' },
    { name: 'Available', value: available, color: '#1E293B' }
  ];

  return (
    <div className="pie-chart-card">
      <h3 className="pie-chart-title">{title}</h3>

      <div className="pie-chart-container">
        <div className="pie-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={35}
                outerRadius={65}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>

              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={35}
                outerRadius={70}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((entry) => (
                  <Cell
                    key={`${entry.name}-overlay`}
                    fill={entry.name === 'Consumed' ? entry.color : 'transparent'}
                  />
                ))}
              </Pie>
            </RePieChart>
          </ResponsiveContainer>

          <div className="pie-chart-center">
            <span className="pie-chart-total">{total}</span>
            <span className="pie-chart-total-label">Total</span>
          </div>
        </div>

        <div className="pie-chart-legend">
          <div className="legend-item">
            <span className="legend-dot consumed"></span>
            <div className="legend-text">
              <div className="legend-number">{String(consumed).padStart(2, '0')}</div>
              <div className="legend-label">Consumed</div>
            </div>
          </div>

          <div className="legend-item">
            <span className="legend-dot available"></span>
            <div className="legend-text">
              <div className="legend-number">{String(available).padStart(2, '0')}</div>
              <div className="legend-label">Available</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default forwardRef(function LeaveStats(_, ref) {
  const { user, loading: authLoading } = useAuth(); // Get current user from auth context
  const [stats, setStats] = useState([
    { title: 'Casual', available: 0, consumed: 0, total: 0 },
    { title: 'Sick', available: 0, consumed: 0, total: 0 },
    { title: 'Emergency', available: 0, consumed: 0, total: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaveStats = async () => {
    // Only proceed if auth is loaded and user is authenticated
    if (authLoading) {
      return; // Wait for auth to load
    }
    
    if (!user || !user.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getUserLeaveBalanceSummary(user.id);
      
      // Process the response to match expected format
      const summary = response.summary || {};
      
      // Map different possible leave type names to standard titles
      // This handles variations like "Casual Leave", "Sick Leave", "Annual Leave", etc.
      const getCategorizedData = (leaveType) => {
        if (!leaveType) return null;
        
        const type = leaveType.toLowerCase();
        
        if (type.includes('casual')) return 'casual';
        if (type.includes('sick')) return 'sick';
        if (type.includes('annual') || type.includes('yearly')) return 'annual';
        if (type.includes('emergancy') || type.includes('emergency')) return 'emergency';
        
        return null; // Unknown type
      };
      
      // Process all leave types from the API response
      const processedSummary = {};
      Object.keys(summary).forEach(key => {
        const leaveData = summary[key];
        const category = getCategorizedData(leaveData.leave_name || key);
        
        if (category) {
          processedSummary[category] = {
            total: leaveData.total || 0,
            consumed: leaveData.consumed || 0,
            available: leaveData.available || 0,
            leave_type_id: leaveData.leave_type_id,
            leave_name: leaveData.leave_name
          };
        }
      });
      
      // Create updated stats based on the processed data
      const updatedStats = [
        { 
          title: 'Casual', 
          available: processedSummary.casual?.available || 0, 
          consumed: processedSummary.casual?.consumed || 0,
          total: processedSummary.casual?.total || 0
        },
        { 
          title: 'Sick', 
          available: processedSummary.sick?.available || 0, 
          consumed: processedSummary.sick?.consumed || 0,
          total: processedSummary.sick?.total || 0
        },
        { 
          title: 'Emergency', 
          available: processedSummary.emergency?.available || 0, 
          consumed: processedSummary.emergency?.consumed || 0,
          total: processedSummary.emergency?.total || 0
        }
      ];

      setStats(updatedStats);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching leave stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveStats();
  }, [user, authLoading]);

  // Expose refreshData function via ref
  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      if (!user || !user.id) {
        setError('User not authenticated');
        return;
      }
      await fetchLeaveStats();
    }
  }));

  if (loading) {
    return (
      <div className="leave-stats-container">
        <div className="loading-message">Loading leave statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leave-stats-container">
        <div className="error-message">Error loading leave statistics: {error}</div>
      </div>
    );
  }

  return (
    <div className="leave-stats-container">
      <div className="pie-charts-grid">
        {stats.map((stat, index) => (
          <LeavePieChart
            key={index}
            title={stat.title}
            available={stat.available}
            consumed={stat.consumed}
          />
        ))}
      </div>
    </div>
  );
});

