const createError = require('http-errors');
const validator = require('lx-valid');

exports.validate = (object, schema, isUpdate = false) => {
  let options = {
    isUpdate,
    strictRequired: !isUpdate,
    unknownProperties: 'delete',
    trim: true,
  };

  const fn = options.isUpdate ? validator.getValidationFunction() : validator.validate;
  const result = fn(object, schema, Object.assign({ cast: true }, options));

  if (!result.valid) {
    const msg = `'${result.errors[0].property}' ${result.errors[0].message}`;
    throw createError(400, msg, result.errors);
  }
};
