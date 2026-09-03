// Import models
const { OfferLetterForm, ServiceLetterForm, User } = require('../models');

// Import from separated controllers
const offerLetterController = require('./offerLetter.controller');
const serviceLetterController = require('./serviceLetter.controller');

// Re-export Offer Letter functions
exports.generateOfferLetterPDF = offerLetterController.generateOfferLetterPDF;
exports.generateOfferLetterPreview = offerLetterController.generateOfferLetterPreview;
exports.sendOfferLetterEmail = offerLetterController.sendOfferLetterEmail;
exports.saveOfferLetterTemplate = offerLetterController.saveOfferLetterTemplate;
exports.getOfferLetterTemplates = offerLetterController.getOfferLetterTemplates;
exports.getEmployeeDetailsForOfferLetter = offerLetterController.getEmployeeDetailsForOfferLetter;
exports.getAllEmployeesForDropdown = offerLetterController.getAllEmployeesForDropdown;
exports.debugListAllEmployees = offerLetterController.debugListAllEmployees;

// Re-export Service Letter functions
exports.generateServiceLetterPDF = serviceLetterController.generateServiceLetterPDF;
exports.generateServiceLetterPreview = serviceLetterController.generateServiceLetterPreview;
exports.sendServiceLetterEmail = serviceLetterController.sendServiceLetterEmail;
exports.saveServiceLetterTemplate = serviceLetterController.saveServiceLetterTemplate;
exports.getServiceLetterTemplates = serviceLetterController.getServiceLetterTemplates;
exports.getAllEmployeesForServiceLetterDropdown = serviceLetterController.getAllEmployeesForServiceLetterDropdown;
exports.getEmployeeDetailsForServiceLetter = serviceLetterController.getEmployeeDetailsForServiceLetter;
exports.debugServiceLetterEmployees = serviceLetterController.debugServiceLetterEmployees;

// @desc    Get all generated letters (Offer + Service letters) from database
// @route   GET /api/templates/letters
// @access  Private (Admin)
exports.getAllLetters = async (req, res) => {
  try {
    const formatDate = (dateVal) => {
      if (!dateVal) return '';
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateVal) => {
      if (!dateVal) return '10:00 AM';
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '10:00 AM';
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    let mappedOffers = [];
    let mappedServices = [];

    // Fetch Offer Letters — wrapped in try/catch so service letters still load if this fails
    try {
      const offerLetters = await OfferLetterForm.findAll({
        include: [
          { model: User, as: 'Recipient', attributes: ['id', 'emp_id', 'first_name', 'last_name', 'designation', 'email', 'department_id'] },
          { model: User, as: 'GeneratedBy', attributes: ['id', 'first_name', 'last_name', 'designation', 'management_role'] }
        ],
        order: [['id', 'DESC']]
      });

      mappedOffers = offerLetters.map(item => {
        const recipient = item.Recipient || {};
        const generatedBy = item.GeneratedBy || {};
        const empName = `${recipient.first_name || ''} ${recipient.last_name && recipient.last_name !== 'null' ? recipient.last_name : ''}`.trim() || 'Employee';
        const genName = `${generatedBy.first_name || ''} ${generatedBy.last_name && generatedBy.last_name !== 'null' ? generatedBy.last_name : ''}`.trim() || 'HR Admin';
        let parsedFormData = null;
        if (item.form_data) {
          try {
            parsedFormData = typeof item.form_data === 'string' ? JSON.parse(item.form_data) : item.form_data;
          } catch (e) {}
        }
        return {
          id: `offer_${item.id}`,
          rawId: item.id,
          documentType: 'Offer Letter',
          employeeName: empName,
          designation: recipient.designation || 'Staff',
          email: recipient.email || '',
          generatedOnDate: formatDate(item.generated_at || item.letter_date),
          generatedOnTime: formatTime(item.generated_at),
          generatedByName: genName,
          generatedByRole: generatedBy.management_role || generatedBy.designation || 'HR',
          status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Draft',
          filePath: item.file_path,
          userId: item.user_id,
          formData: parsedFormData,
          createdAt: item.generated_at || item.letter_date
        };
      });
    } catch (offerErr) {
      console.error('Error fetching offer letters (continuing with service letters):', offerErr.message);
    }

    // Fetch Service Letters — wrapped in try/catch so offer letters still load if this fails
    try {
      const serviceLetters = await ServiceLetterForm.findAll({
        include: [
          { model: User, as: 'Recipient', attributes: ['id', 'emp_id', 'first_name', 'last_name', 'designation', 'email', 'department_id'] },
          { model: User, as: 'GeneratedBy', attributes: ['id', 'first_name', 'last_name', 'designation', 'management_role'] }
        ],
        order: [['id', 'DESC']]
      });

      mappedServices = serviceLetters.map(item => {
        const recipient = item.Recipient || {};
        const generatedBy = item.GeneratedBy || {};
        const empName = `${recipient.first_name || ''} ${recipient.last_name && recipient.last_name !== 'null' ? recipient.last_name : ''}`.trim() || 'Employee';
        const genName = `${generatedBy.first_name || ''} ${generatedBy.last_name && generatedBy.last_name !== 'null' ? generatedBy.last_name : ''}`.trim() || 'HR Admin';
        let parsedFormData = null;
        if (item.form_data) {
          try {
            parsedFormData = typeof item.form_data === 'string' ? JSON.parse(item.form_data) : item.form_data;
          } catch (e) {}
        }
        return {
          id: `service_${item.id}`,
          rawId: item.id,
          documentType: 'Service Letter',
          employeeName: empName,
          designation: recipient.designation || 'Staff',
          email: recipient.email || '',
          generatedOnDate: formatDate(item.generated_at || item.letter_date),
          generatedOnTime: formatTime(item.generated_at),
          generatedByName: genName,
          generatedByRole: generatedBy.management_role || generatedBy.designation || 'HR',
          status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Draft',
          filePath: item.file_path,
          userId: item.user_id,
          formData: parsedFormData,
          createdAt: item.generated_at || item.letter_date
        };
      });
    } catch (serviceErr) {
      console.error('Error fetching service letters (continuing with offer letters):', serviceErr.message);
    }

    const combined = [...mappedOffers, ...mappedServices].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    res.status(200).json({
      success: true,
      message: 'Letter records retrieved successfully',
      data: combined,
      count: combined.length
    });
  } catch (error) {
    console.error('Error fetching all letters:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve letters', error: error.message });
  }
};

// @desc    Delete a generated letter record
// @route   DELETE /api/templates/letters/:documentType/:id
// @access  Private (Admin)
exports.deleteLetter = async (req, res) => {
  try {
    const { documentType, id } = req.params;
    const cleanId = String(id).replace(/^(offer_|service_)/, '');

    if (documentType === 'Offer Letter' || documentType === 'offer') {
      await OfferLetterForm.destroy({ where: { id: cleanId } });
    } else if (documentType === 'Service Letter' || documentType === 'service') {
      await ServiceLetterForm.destroy({ where: { id: cleanId } });
    } else {
      await Promise.all([
        OfferLetterForm.destroy({ where: { id: cleanId } }),
        ServiceLetterForm.destroy({ where: { id: cleanId } })
      ]);
    }

    res.status(200).json({ success: true, message: 'Letter record deleted successfully' });
  } catch (error) {
    console.error('Error deleting letter:', error);
    res.status(500).json({ success: false, message: 'Failed to delete letter', error: error.message });
  }
};
