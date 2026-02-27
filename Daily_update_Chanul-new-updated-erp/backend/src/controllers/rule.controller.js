// controllers/rule.controller.js
const db = require('../models');
const Rule = db.Rule;
const RuleCategory = db.RuleCategory;

module.exports = {
  // GET /api/rules
  getAll: async (req, res) => {
    try {
      const where = {};
      if (req.query.category_id) where.category_id = req.query.category_id;

      const rules = await Rule.findAll({
        where,
        include: [{ model: RuleCategory, attributes: ['id', 'name'] }]
      });

      res.status(200).json({ data: rules });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error fetching rules.' });
    }
  },

  // GET /api/rules/:id
  getOne: async (req, res) => {
    try {
      const rule = await Rule.findByPk(req.params.id, {
        include: [{ model: RuleCategory, attributes: ['id', 'name'] }]
      });

      if (!rule) return res.status(404).json({ message: 'Rule not found.' });
      res.status(200).json({ data: rule });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error fetching rule.' });
    }
  },

  // POST /api/rules
  // status is NOT accepted from user (default = active)
  create: async (req, res) => {
    try {
      const { category_id, rule_text } = req.body;

      if (!category_id)
        return res.status(400).json({ message: 'category_id is required.' });

      if (!rule_text || rule_text.trim() === '')
        return res.status(400).json({ message: 'rule_text is required.' });

      const category = await RuleCategory.findByPk(category_id);
      if (!category)
        return res.status(400).json({ message: 'Invalid category_id.' });

      const newRule = await Rule.create({
        category_id,
        rule_text: rule_text.trim()
        // status NOT passed → defaultValue = 'active'
      });

      res.status(201).json({
        message: 'Rule created successfully.',
        data: newRule
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error creating rule.' });
    }
  },

  // PUT /api/rules/:id
  // status CAN be updated here
  update: async (req, res) => {
    try {
      const { category_id, rule_text, status } = req.body;
      const rule = await Rule.findByPk(req.params.id);

      if (!rule) return res.status(404).json({ message: 'Rule not found.' });

      if (category_id) {
        const category = await RuleCategory.findByPk(category_id);
        if (!category)
          return res.status(400).json({ message: 'Invalid category_id.' });
        rule.category_id = category_id;
      }

      if (rule_text !== undefined) {
        if (!rule_text || rule_text.trim() === '')
          return res.status(400).json({ message: 'rule_text cannot be empty.' });
        rule.rule_text = rule_text.trim();
      }

      if (status !== undefined) {
        const allowed = ['active', 'halt', 'inactive'];
        if (!allowed.includes(status))
          return res
            .status(400)
            .json({ message: `Invalid status. Allowed: ${allowed.join(', ')}` });

        rule.status = status;
      }

      await rule.save();
      res.status(200).json({
        message: 'Rule updated successfully.',
        data: rule
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error updating rule.' });
    }
  },

  // DELETE /api/rules/:id
  delete: async (req, res) => {
    try {
      const rule = await Rule.findByPk(req.params.id);
      if (!rule) return res.status(404).json({ message: 'Rule not found.' });

      await rule.destroy();
      res.status(200).json({ message: 'Rule deleted successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error deleting rule.' });
    }
  }
};
