const Document = require('../models/document.model');
const { find, findOne } = require('../utils/query');
const { validate } = require('../utils/validator');
const { response } = require('../middlewares/api-response');

class DocumentController {
  static async submitDocument(req, res, next) {
    try {
      const existingDoc = await Document.findOne({
        user: req.user.id,
        status: 'pending',
      });
      if (existingDoc) {
        return response(res, 409, 'You have a pending verification request');
      }
      if (!req.file) {
        return response(res, 400, 'document upload required');
      }
      const verification = await Document.create({
        ...req.body,
        documentUrl: req.file.path,
        user: req.user.id,
      });
      return response(
        res,
        200,
        'verification request successful',
        verification
      );
    } catch (error) {
      next(error);
    }
  }

  static async viewDocuments(req, res, next) {
    try {
      const conditions = ['superadmin', 'admin'].includes(req.user.type)
        ? {}
        : { user: req.user.id };
      const requests = await find(Document, req, conditions);
      return response(
        res,
        200,
        'verification requests fetched successfully',
        requests
      );
    } catch (error) {
      next(error);
    }
  }

  static async viewDocument(req, res, next) {
    try {
      const conditions = ['superadmin', 'admin'].includes(req.user.type)
        ? {}
        : { user: req.user.id };
      const request = await findOne(Document, req, conditions);
      return response(
        res,
        200,
        'verification request fetched successfully',
        request
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateDocument(req, res, next) {
    try {
      DocumentController.validateRequest(req.body);
      const { status, remarks } = req.body;
      const thisDoc = await Document.findById(req.params.docId).populate(
        'user'
      );
      if (!thisDoc) {
        return response(res, 400, 'document not found');
      }
      thisDoc.set({
        status,
        remarks,
        actionBy: req.user.id,
      });
      await thisDoc.save();
      const { user, document, documentNumber } = thisDoc;
      if (status === 'verified' && user.isBVNVerified) {
        user.isKYCVerified = true;
        user.identificationDoc = document;
        user.identificationDocNumber = documentNumber;
        await user.save();
      }
      return response(res, 200, 'document updated sucessfully', thisDoc);
    } catch (error) {
      next(error);
    }
  }

  static async deleteMyDoc(req, res, next) {
    try {
      const doc = await Document.findOneAndDelete({
        user: req.user.id,
        _id: req.params.docId,
      });
      if (!doc) return response(res, 404, 'document not found');
      return response(res, 200, 'document deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static validateRequest(body) {
    const fields = {
      status: {
        type: 'string',
        required: true,
        enum: ['pending', 'verified', 'declined'],
      },
      remarks: {
        type: 'string',
        required: false,
      },
    };

    validate(body, { properties: fields });
  }
}
module.exports = DocumentController;
