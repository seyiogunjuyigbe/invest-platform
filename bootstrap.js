const User = require('./models/user.model');

async function seedSuperAdmin() {
  const superadmin = await User.findOne({
    type: 'superadmin',
    email: 'developer@techatpurplegate.com',
  });

  if (!superadmin) {
    await User.create({
      type: 'superadmin',
      email: 'developer@techatpurplegate.com',
      phone: '123456',
      password: 'sup3Rdup3rY0!',
      firstName: 'Super',
      lastName: 'Admin',
      isEmailVerified: true,
    });
  }
}

module.exports = async function bootstrap() {
  await seedSuperAdmin();
};
