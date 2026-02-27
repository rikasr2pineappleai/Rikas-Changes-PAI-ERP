const express = require('express');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// @desc    Get sidebar menu items based on user role
// @route   GET /api/sidebar/menu
// @access  Private
router.route('/menu').get(protect, (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Define menu items for different roles
    const adminMenu = [
      { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { path: '/employees', label: 'Employees', icon: 'employee' },
      { path: '/leave', label: 'Leaves', icon: 'leave' },
      { path: '/recruitment', label: 'Recruitment', icon: 'recruitment' },
      { path: '/projects', label: 'Projects', icon: 'project' },
      { path: '/payroll', label: 'Payroll', icon: 'payroll' },
      { path: '/templates', label: 'Templates', icon: 'project' },
      { path: '/settings', label: 'Settings', icon: 'setting' },
      { path: '/logout', label: 'Logout', icon: 'logout' }
    ];

    const staffMenu = [
      { path: '/employee-dashboard', label: 'Dashboard', icon: 'dashboard' },
      { path: '/tasks', label: 'My Tasks', icon: 'task' },
      { path: '/leaves', label: 'Leaves', icon: 'leave' },
      { path: '/performance', label: 'Performance', icon: 'performance' },
      { path: '/settings', label: 'Settings', icon: 'setting' },
      { path: '/logout', label: 'Logout', icon: 'logout' }
    ];

    // Return appropriate menu based on user role
    const menuItems = userRole === 'admin' ? adminMenu : staffMenu;

    res.status(200).json({
      success: true,
      data: {
        menuItems
      }
    });
  } catch (error) {
    console.error('Sidebar menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sidebar menu',
      error: error.message
    });
  }
});

module.exports = router;