class Account {
  function(req, res, next) {
    res.render('index', { title: 'Express' });
  }
}
module.exports =  Account
