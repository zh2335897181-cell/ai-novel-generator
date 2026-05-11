import bcrypt from 'bcryptjs';
bcrypt.hash('root', 10).then(hash => console.log(hash));
