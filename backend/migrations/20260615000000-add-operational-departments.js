const DEPARTMENT_NAMES = [
  "QA Department",
  "Designing Department",
  "Developing Department",
  "Cyber Security & Network Department",
  "BA & PM Department",
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const existingRows = await queryInterface.sequelize.query(
      "SELECT dept_name FROM department WHERE dept_name IN (:names)",
      {
        replacements: { names: DEPARTMENT_NAMES },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const existingNames = new Set(existingRows.map((row) => row.dept_name));
    const missingDepartments = DEPARTMENT_NAMES
      .filter((name) => !existingNames.has(name))
      .map((name) => ({
        dept_name: name,
        hod_user_id: null,
        created_at: new Date(),
      }));

    if (missingDepartments.length > 0) {
      await queryInterface.bulkInsert("department", missingDepartments);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("department", {
      dept_name: DEPARTMENT_NAMES,
    });
  },
};
