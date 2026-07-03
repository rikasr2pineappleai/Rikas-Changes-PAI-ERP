const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    emp_id: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    first_name: { type: DataTypes.STRING(50), allowNull: false },
    last_name: { type: DataTypes.STRING(50), allowNull: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'employee'), defaultValue: 'employee' },
    management_role: { type: DataTypes.STRING(100), allowNull: true },
    status: { type: DataTypes.ENUM('active', 'inactive', 'terminated'), defaultValue: 'active' },
    report_to: { type: DataTypes.INTEGER, allowNull: true },
    department_id: { type: DataTypes.INTEGER, allowNull: true },
    designation: { type: DataTypes.STRING(100), allowNull: true },
    reset_otp: { type: DataTypes.STRING(10), allowNull: true },
    reset_otp_expires: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'users',
    timestamps: false
  });

  User.associate = (models) => {
    // Self-reference for report_to
    User.belongsTo(User, { foreignKey: 'report_to', as: 'ReportTo' });
    User.hasMany(User, { foreignKey: 'report_to', as: 'ReportsToMe' });
    // UserRole
    User.belongsToMany(models.Role, { through: models.UserRole, foreignKey: 'user_id' });
    User.hasMany(models.UserRole, { foreignKey: 'assigned_by', as: 'AssignedUserRoles' });
    // RoleAssignmentLog
    User.hasMany(models.RoleAssignmentLog, { foreignKey: 'user_id' });
    User.hasMany(models.RoleAssignmentLog, { foreignKey: 'changed_by', as: 'ChangedRoles' });
    // Department HOD
    User.hasMany(models.Department, { foreignKey: 'hod_user_id', as: 'HODOf' });
    // EmployeeDetail
    User.hasOne(models.EmployeeDetail, { foreignKey: 'user_id' });
    // EmployeeHistory
    User.hasMany(models.EmployeeHistory, { foreignKey: 'user_id', as: 'EmployeeHistories' });
    User.hasMany(models.PromotionHistory, { foreignKey: 'user_id', as: 'PromotionHistories' });
    // LeaveBalance
    User.hasMany(models.LeaveBalance, { foreignKey: 'user_id' });
    // LeaveRequest
    User.hasMany(models.LeaveRequest, { foreignKey: 'user_id' });
    User.hasMany(models.LeaveRequest, { foreignKey: 'approved_by', as: 'ApprovedLeaveRequests' });
    // Project PM
    User.hasMany(models.Project, { foreignKey: 'pm_user_id', as: 'ManagedProjects' });
    // ProjectAllocation
    User.hasMany(models.ProjectAllocation, { foreignKey: 'user_id' });
    // Task
    User.hasMany(models.Task, { foreignKey: 'assigned_to', as: 'AssignedTasks' });
    User.hasMany(models.Task, { foreignKey: 'assigned_by', as: 'CreatedTasks' });
    // TaskDelay
    User.hasMany(models.TaskDelay, { foreignKey: 'approved_by', as: 'ApprovedTaskDelays' });
    // Defect
    User.hasMany(models.Defect, { foreignKey: 'reporter_id', as: 'ReportedDefects' });
    User.hasMany(models.Defect, { foreignKey: 'assignee_id', as: 'AssignedDefects' });
    // DefectComment
    User.hasMany(models.DefectComment, { foreignKey: 'user_id' });
    // AttendanceRecord
    User.hasMany(models.AttendanceRecord, { foreignKey: 'user_id' });
    // Payroll
    User.hasMany(models.Payroll, { foreignKey: 'user_id' });
    // AwayLog
    User.hasMany(models.AwayLog, { foreignKey: 'user_id' });
    // Expense
    User.hasMany(models.Expense, { foreignKey: 'user_id' });
    // Asset assigned_to
    User.hasMany(models.Asset, { foreignKey: 'assigned_to', as: 'AssignedAssets' });
    // Ticket
    User.hasMany(models.Ticket, { foreignKey: 'raised_by', as: 'RaisedTickets' });
    User.hasMany(models.Ticket, { foreignKey: 'assigned_to', as: 'AssignedTickets' });
    // Notification
    User.hasMany(models.Notification, { foreignKey: 'user_id' });
    // AuditLog
    User.hasMany(models.AuditLog, { foreignKey: 'user_id' });
    // OfferLetterForm
    User.hasMany(models.OfferLetterForm, { foreignKey: 'user_id' });
    User.hasMany(models.OfferLetterForm, { foreignKey: 'generated_by', as: 'GeneratedOfferLetters' });
    // ServiceLetterForm
    User.hasMany(models.ServiceLetterForm, { foreignKey: 'user_id' });
    User.hasMany(models.ServiceLetterForm, { foreignKey: 'generated_by', as: 'GeneratedServiceLetters' });
    // TeamLeadStaff
    User.hasMany(models.TeamLeadStaff, { foreignKey: 'team_lead_user_id', as: 'LedStaff' });
    User.hasMany(models.TeamLeadStaff, { foreignKey: 'staff_user_id', as: 'LeadBy' });
    // TrainerTrainee
    User.hasMany(models.TrainerTrainee, { foreignKey: 'trainer_user_id', as: 'TrainedTrainees' });
    User.hasMany(models.TrainerTrainee, { foreignKey: 'trainee_user_id', as: 'TrainedBy' });
    // Department
    User.belongsTo(models.Department, { foreignKey: 'department_id' });
    // Document
    User.hasMany(models.Document, { foreignKey: 'user_id', as: 'Documents' });
  };

  return User;
};
