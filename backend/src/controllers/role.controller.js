// controllers/role.controller.js
const { RoleRule, Role, RuleCategory, sequelize } = require('../models');

const createRoleRule = async (req, res) => {
  try {
    const { role_id } = req.params;
    const { rule_category_id } = req.body;

    if (!rule_category_id) {
      return res.status(400).json({ message: 'rule_category_id is required in request body.' });
    }

    // Optional: validate role and rule category exist
    const role = await Role.findByPk(role_id);
    if (!role) return res.status(404).json({ message: `Role with id ${role_id} not found.` });

    const ruleCat = await RuleCategory.findByPk(rule_category_id);
    if (!ruleCat) return res.status(404).json({ message: `RuleCategory with id ${rule_category_id} not found.` });

    // Prevent duplicate
    const existing = await RoleRule.findOne({ where: { role_id, rule_category_id } });
    if (existing) return res.status(409).json({ message: 'This role-rule mapping already exists.' });

    const created = await RoleRule.create({ role_id, rule_category_id });
    return res.status(201).json({ message: 'RoleRule created successfully.', data: created });
  } catch (error) {
    console.error('createRoleRule error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const getRoleRules = async (req, res) => {
  try {
    const { role_id } = req.params;
    // validate role exists optionally
    const role = await Role.findByPk(role_id);
    if (!role) return res.status(404).json({ message: `Role with id ${role_id} not found.` });

    const rules = await RoleRule.findAll({
      where: { role_id },
      include: [{ model: RuleCategory, as: 'RuleCategory' }]
    });

    return res.json({ data: rules });
  } catch (error) {
    console.error('getRoleRules error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const getRoleRule = async (req, res) => {
  try {
    const { role_id, rule_category_id } = req.params;
    const mapping = await RoleRule.findOne({ where: { role_id, rule_category_id } });

    if (!mapping) return res.status(404).json({ message: 'RoleRule mapping not found.' });
    return res.json({ data: mapping });
  } catch (error) {
    console.error('getRoleRule error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const updateRoleRule = async (req, res) => {
  try {
    const { role_id, rule_category_id } = req.params;
    const { rule_category_id: new_rule_category_id } = req.body;

    if (!new_rule_category_id) {
      return res.status(400).json({ message: 'New rule_category_id is required in request body.' });
    }

    // find existing mapping
    const mapping = await RoleRule.findOne({ where: { role_id, rule_category_id } });
    if (!mapping) return res.status(404).json({ message: 'RoleRule mapping to update not found.' });

    // check target RuleCategory exists
    const targetRuleCat = await RuleCategory.findByPk(new_rule_category_id);
    if (!targetRuleCat) return res.status(404).json({ message: `RuleCategory with id ${new_rule_category_id} not found.` });

    // If a mapping with same role_id and new_rule_category_id already exists, prevent duplicate
    const duplicate = await RoleRule.findOne({ where: { role_id, rule_category_id: new_rule_category_id } });
    if (duplicate) return res.status(409).json({ message: 'A mapping with that rule_category_id already exists for this role.' });

    // Since role_id + rule_category_id are primary keys, some DBs allow updating the PK.
    // To be safe and portable, we'll perform this as a transaction: delete old row and create new row.
    await sequelize.transaction(async (t) => {
      await mapping.destroy({ transaction: t });
      await RoleRule.create({ role_id, rule_category_id: new_rule_category_id }, { transaction: t });
    });

    return res.json({ message: 'RoleRule mapping updated successfully.' });
  } catch (error) {
    console.error('updateRoleRule error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const deleteRoleRule = async (req, res) => {
  try {
    const { role_id, rule_category_id } = req.params;
    const mapping = await RoleRule.findOne({ where: { role_id, rule_category_id } });

    if (!mapping) return res.status(404).json({ message: 'RoleRule mapping not found.' });

    await mapping.destroy();
    return res.json({ message: 'RoleRule mapping deleted successfully.' });
  } catch (error) {
    console.error('deleteRoleRule error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  createRoleRule,
  getRoleRules,
  getRoleRule,
  updateRoleRule,
  deleteRoleRule
};
