const superagent = require('superagent');
const { buildUrlParams } = require('./app');

class HttpService {
  async post(url, data, headers = {}) {
    let response = superagent.post(url).set('Content-Type', 'application/json');

    if (headers && Object.keys(headers).length) {
      Object.keys(headers).forEach(key => {
        response = response.set(key, headers[key]);
      });
    }

    return response.send(data).then(res => res.body);
  }

  async get(url, headers, params = {}) {
    let response = superagent
      .get(`${buildUrlParams(url, params)}`)
      .set('Content-Type', 'application/json');

    if (headers && Object.keys(headers).length) {
      Object.keys(headers).forEach(key => {
        response = response.set(key, headers[key]);
      });
    }

    return response.then(res => res.body);
  }
}

export default new HttpService();
