const db = require("../models");
const { User, EmployeeDetail } = db;

// Get all users for assignment purposes (with first_name and relevant fields)
exports.getUsersForAssignment = async (req, res) => {
  try {
    // Fetch all active users with first_name and other relevant fields
    const users = await User.findAll({
      attributes: ['id', 'first_name', 'last_name', 'emp_id', 'role', 'designation'],
      include: [
        {
          model: EmployeeDetail,
          as: 'EmployeeDetail',
          attributes: ['image_path'],
          required: false  // Use left join instead of inner join
        }
      ],
      where: {
        status: 'active'  // Only fetch active users
      },
      order: [['first_name', 'ASC']]  // Order alphabetically by first name
    });

    // Format the users data for the frontend
    const formattedUsers = users.map(user => {
      const userData = user.toJSON();
      return {
        id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        emp_id: userData.emp_id,
        role: userData.role,
        designation: userData.designation,
        name: [userData.first_name, userData.last_name].filter(Boolean).join(' ').trim(),  // Full name
        profile_pic: userData.EmployeeDetail?.image_path || null
      };
    });

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully for assignment",
      users: formattedUsers
    });
  } catch (error) {
    console.error("getUsersForAssignment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users for assignment",
      error: error.message
    });
  }
};