// controllers/rulecategory.controller.js
const db = require('../models');
const { RuleCategory } = db;

module.exports = {
  // POST /api/rule-category
  create: async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name || name.toString().trim() === '') {
        return res.status(400).json({ message: 'Name is required.' });
      }

      // optional: prevent duplicate names (case-insensitive)
      const existing = await RuleCategory.findOne({
        where: db.sequelize.where(
          db.sequelize.fn('lower', db.sequelize.col('name')),
          name.toString().toLowerCase()
        )
      });

      if (existing) {
        return res.status(409).json({ message: 'A rule category with this name already exists.' });
      }

      const newCategory = await RuleCategory.create({
        name: name.toString().trim(),
        description: description || null
      });

      return res.status(201).json({
        message: 'Rule category created successfully.',
        data: newCategory
      });
    } catch (err) {
      console.error('Error creating RuleCategory:', err);
      return res.status(500).json({ message: 'Server error creating rule category.' });
    }
  },

  // DELETE /api/rule-category/:id
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: 'ID parameter is required.' });

      const category = await RuleCategory.findByPk(id);
      if (!category) return res.status(404).json({ message: 'Rule category not found.' });

      await category.destroy(); // onDelete CASCADE will be honored by DB if FK constraints exist
      return res.status(200).json({ message: 'Rule category deleted successfully.' });
    } catch (err) {
      console.error('Error deleting RuleCategory:', err);
      return res.status(500).json({ message: 'Server error deleting rule category.' });
    }
  }
};
