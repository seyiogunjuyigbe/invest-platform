const _ = require('lodash');

function processPopulate(query) {
  const paths = query.split('.');
  let currentPopulate;
  while (paths.length) {
    const path = paths.pop();
    const populate = { path };
    if (currentPopulate) {
      currentPopulate = { path, populate: currentPopulate };
    } else {
      currentPopulate = populate;
    }
  }

  return currentPopulate;
}

const get = async (model, req, conditions = {}, multiple = true) => {
  const { query } = req;
  const { populate } = query;
  const limit = parseInt(query.limit || '10', 10);
  const offset = parseInt(query.offset || '0', 10);
  const orderBy = query.orderBy ? query.orderBy : 'createdAt';
  const order = query.order ? query.order : 'desc';

  delete query.limit;
  delete query.offset;
  delete query.populate;
  delete query.order;
  delete query.orderBy;
  delete query.hours;

  if (!_.isEmpty(query)) {
    Object.keys(query).forEach(field => {
      let value = query[field];
      switch (value) {
        case 'true':
          value = true;
          break;

        case 'false':
          value = false;
          break;

        default:
          break;
      }
      conditions[field] = value;
    });
  }

  if (!multiple && !conditions._id) {
    const { params } = req;
    const paramId = Object.keys(params).find(param =>
      param.toLowerCase().includes('id')
    );
    conditions._id = req.params[paramId];
  }

  let q = model[multiple ? 'find' : 'findOne'](conditions);

  if (populate) {
    if (Array.isArray(populate) && populate.length) {
      populate.forEach(field => {
        q = q.populate(processPopulate(field));
      });
    } else {
      q = q.populate(processPopulate(populate));
    }
  }

  if (multiple) {
    const total = await model.countDocuments(conditions);
    q = q
      .skip(offset)
      .limit(limit)
      .sort({ [orderBy]: order });
    const data = await q.skip(offset).limit(limit);
    return {
      data,
      meta: { limit, offset, total },
    };
  }

  return q;
};

exports.find = async (model, req, conditions = {}) =>
  get(model, req, conditions, true);

exports.findOne = async (model, req, conditions = {}) =>
  get(model, req, conditions, false);
