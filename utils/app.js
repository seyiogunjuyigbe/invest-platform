exports.objToQueryParams = function objToQueryParams(obj) {
  return Object.keys(obj).reduce((query, key) => {
    let pre = '';
    if (query !== '') {
      pre = `${query}&`;
    }
    return `${pre}${key}=${obj[key]}`;
  }, '');
};

exports.buildUrlParams = function buildUrlParams(url, params = {}) {
  const link = url.replace(/(\/|\?)$/, '');
  const paramQuery = exports.objToQueryParams(params);
  const join = link.includes('?') ? '&' : '?';
  return `${link}${join}${paramQuery}`;
};
