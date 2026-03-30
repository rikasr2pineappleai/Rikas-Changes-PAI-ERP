const { Rating, User } = require('../models');

/**
 * Submit ratings for an employee
 * Admin/Manager rates multiple criteria for an employee
 */
exports.submitRatings = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { ratings } = req.body; // Array of {criteria, rating, remarks, raterRole}
    const raterId = req.user.id; // Current user (admin/manager)

    // Validate employee exists
    const employee = await User.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Validate rater is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can submit ratings'
      });
    }

    // Validate ratings array
    if (!Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ratings array is required and cannot be empty'
      });
    }

    // Delete old ratings from this rater for this employee (to avoid duplicates)
    await Rating.destroy({
      where: {
        employee_id: employeeId,
        rater_id: raterId
      }
    });

    // Get rater info once (for fallback if raterRole not provided)
    const rater = await User.findByPk(raterId);
    const defaultRaterDesignation = rater?.designation || rater?.management_role || 'Admin';

    // Create new ratings
    const createdRatings = [];
    for (const rating of ratings) {
      // Validate rating object
      if (!rating.criteria || !rating.rating) {
        return res.status(400).json({
          success: false,
          message: 'Each rating must have criteria and rating value'
        });
      }

      if (rating.rating < 1 || rating.rating > 10) {
        return res.status(400).json({
          success: false,
          message: 'Rating values must be between 1 and 10'
        });
      }

      // Use the provided raterRole from the request, or use default
      const raterDesignation = rating.raterRole || defaultRaterDesignation;

      const newRating = await Rating.create({
        employee_id: employeeId,
        rater_id: raterId,
        rater_designation: raterDesignation,
        criteria: rating.criteria,
        rating: rating.rating,
        remarks: rating.remarks || null
      });

      createdRatings.push(newRating);
    }

    res.status(201).json({
      success: true,
      message: `${createdRatings.length} ratings submitted successfully`,
      data: createdRatings
    });
  } catch (error) {
    console.error('Error submitting ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting ratings',
      error: error.message
    });
  }
};

/**
 * Get all ratings for an employee
 * Retrieve ratings grouped by rater designation
 */
exports.getEmployeeRatings = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Validate employee exists
    const employee = await User.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get all ratings for this employee
    const ratings = await Rating.findAll({
      where: {
        employee_id: employeeId
      },
      include: [
        {
          model: User,
          as: 'Rater',
          attributes: ['id', 'first_name', 'last_name', 'designation', 'management_role']
        }
      ],
      order: [['criteria', 'ASC'], ['rater_designation', 'ASC']]
    });

    if (ratings.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No ratings found for this employee',
        data: {}
      });
    }

    // Group ratings by criteria and rater designation
    const groupedRatings = {};
    const designationMap = {}; // Map designation to abbreviation

    ratings.forEach(r => {
      const criteria = r.criteria;
      const designation = r.rater_designation || 'Unknown';

      if (!groupedRatings[criteria]) {
        groupedRatings[criteria] = {
          criteria: criteria,
          ratings: {}
        };
      }

      // Use abbreviation for designation (e.g., TL, PM, COO, CTO, CEO)
      const abbr = getDesignationAbbreviation(designation);
      designationMap[abbr] = designation;

      groupedRatings[criteria].ratings[abbr] = {
        value: r.rating,
        remarks: r.remarks,
        rater_id: r.rater_id,
        rater_name: `${r.Rater.first_name} ${r.Rater.last_name}`,
        updated_at: r.updated_at
      };
    });

    // Convert to array format for Performance page
    const performanceData = Object.values(groupedRatings).map(item => {
      const ratingObj = {
        criteria: item.criteria
      };

      // Add all possible designations
      ['tl', 'pm', 'coo', 'cto', 'ceo'].forEach(key => {
        if (item.ratings[key.toUpperCase()]) {
          ratingObj[key] = item.ratings[key.toUpperCase()].value;
        }
      });

      return ratingObj;
    });

    res.status(200).json({
      success: true,
      message: 'Employee ratings retrieved successfully',
      data: {
        employee_id: employeeId,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        grouped_ratings: groupedRatings,
        performance_data: performanceData,
        designation_map: designationMap,
        total_criteria_rated: Object.keys(groupedRatings).length
      }
    });
  } catch (error) {
    console.error('Error retrieving employee ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving employee ratings',
      error: error.message
    });
  }
};

/**
 * Get remarks for a specific criteria of an employee
 */
exports.getRatingRemarks = async (req, res) => {
  try {
    const { employeeId, criteria } = req.params;

    const ratings = await Rating.findAll({
      where: {
        employee_id: employeeId,
        criteria: decodeURIComponent(criteria)
      },
      include: [
        {
          model: User,
          as: 'Rater',
          attributes: ['id', 'first_name', 'last_name', 'designation', 'management_role']
        }
      ]
    });

    if (ratings.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No remarks found for this criteria',
        data: {}
      });
    }

    // Group remarks by designation abbreviation
    const remarks = {};
    ratings.forEach(r => {
      const abbr = getDesignationAbbreviation(r.rater_designation || 'Unknown');
      remarks[abbr] = r.remarks || 'No remarks provided';
    });

    res.status(200).json({
      success: true,
      message: 'Remarks retrieved successfully',
      data: {
        employee_id: employeeId,
        criteria: criteria,
        remarks: remarks
      }
    });
  } catch (error) {
    console.error('Error retrieving remarks:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving remarks',
      error: error.message
    });
  }
};

/**
 * Get all ratings given by a specific rater
 */
exports.getRaterRatings = async (req, res) => {
  try {
    const raterId = req.user.id;

    const ratings = await Rating.findAll({
      where: {
        rater_id: raterId
      },
      include: [
        {
          model: User,
          as: 'Employee',
          attributes: ['id', 'emp_id', 'first_name', 'last_name', 'designation']
        }
      ],
      order: [['employee_id', 'ASC'], ['criteria', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: 'Rater ratings retrieved successfully',
      data: {
        rater_id: raterId,
        total_employees_rated: new Set(ratings.map(r => r.employee_id)).size,
        total_ratings: ratings.length,
        ratings: ratings
      }
    });
  } catch (error) {
    console.error('Error retrieving rater ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving rater ratings',
      error: error.message
    });
  }
};

/**
 * Update a specific rating
 */
exports.updateRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { rating, remarks } = req.body;
    const userId = req.user.id;

    // Find the rating
    const ratingRecord = await Rating.findByPk(ratingId);
    if (!ratingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Only admin or the rater can update
    if (req.user.role !== 'admin' && ratingRecord.rater_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this rating'
      });
    }

    // Validate rating value
    if (rating && (rating < 1 || rating > 10)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 10'
      });
    }

    // Update the rating
    const updatedRating = await ratingRecord.update({
      rating: rating || ratingRecord.rating,
      remarks: remarks !== undefined ? remarks : ratingRecord.remarks,
      updated_at: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      data: updatedRating
    });
  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating rating',
      error: error.message
    });
  }
};

/**
 * Delete a rating
 */
exports.deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const userId = req.user.id;

    // Find the rating
    const ratingRecord = await Rating.findByPk(ratingId);
    if (!ratingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Only admin or the rater can delete
    if (req.user.role !== 'admin' && ratingRecord.rater_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this rating'
      });
    }

    await ratingRecord.destroy();

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting rating',
      error: error.message
    });
  }
};

/**
 * Helper function to map designation to abbreviation
 */
function getDesignationAbbreviation(designation) {
  if (!designation) return 'ADMIN';

  const designation_lower = designation.toLowerCase();

  if (designation_lower.includes('team lead')) return 'TL';
  if (designation_lower.includes('project manager')) return 'PM';
  if (designation_lower.includes('coo')) return 'COO';
  if (designation_lower.includes('cto')) return 'CTO';
  if (designation_lower.includes('ceo')) return 'CEO';

  // Return the designation as-is if it matches common role abbreviations
  const upperDesignation = designation.toUpperCase();
  if (['TL', 'PM', 'COO', 'CTO', 'CEO'].includes(upperDesignation)) {
    return upperDesignation;
  }

  // Return first two letters as default abbreviation
  return designation.substring(0, 2).toUpperCase();
}

/**
 * Debug endpoint - Get all ratings in the database
 */
exports.getAllRatings = async (req, res) => {
  try {
    // Only allow admin to access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access this endpoint'
      });
    }

    const ratings = await Rating.findAll({
      include: [
        {
          model: User,
          as: 'Employee',
          attributes: ['id', 'emp_id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'Rater',
          attributes: ['id', 'emp_id', 'first_name', 'last_name']
        }
      ],
      raw: true
    });

    res.status(200).json({
      success: true,
      total_ratings: ratings.length,
      data: ratings
    });
  } catch (error) {
    console.error('Error fetching all ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ratings',
      error: error.message
    });
  }
};