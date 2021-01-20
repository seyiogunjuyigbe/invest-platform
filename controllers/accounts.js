class Account {
  function(req, res) {
    res.render('index', { title: 'Express' });
  }
}
module.exports = Account;
