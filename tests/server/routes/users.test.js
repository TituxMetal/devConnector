const request = require('supertest')
const path = require('path')

const root = path.join(__dirname, '../../../src/')
const data = path.join(__dirname, '../../data/')
const helpers = path.join(__dirname, '../../helpers/')

const server = require(root + 'server')
const { usersRoutes } = require(data + 'routes')
const { Utils , fakeData } = require(helpers + 'utils')

describe('Users route', () => {
  afterAll(async () => {
    await Utils.dropDatabase()
    console.log('\n Test database dropped')
    return mongoose.connection.close()
  })
  
  describe('GET /api/users/current', () => {
    it('should return 401 if no token', async () => {
      const res = await request(server).get(usersRoutes.current)

      expect(res.status).toEqual(401)
    })

    it('should return current logged in user info', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const res = await request(server).get(usersRoutes.current).set('Authorization', token)
      
      expect(res.status).toEqual(200)
      expect(res.body.name).toEqual(user.name)
      expect(res.body.email).toEqual(user.email)
      expect(res.body.avatar).toBeDefined()
      expect(res.body.avatar).toEqual(user.avatar)
    })
  })

  describe('POST /api/users/register', () => {
    it('should create new user if email not exists', async () => {
      const user = { ...fakeData.user }
      const res = await request(server).post(usersRoutes.register).send(user)

      expect(res.status).toEqual(200)
      expect(res.body.name).toEqual(user.name)
      expect(res.body.email).toEqual(user.email)
      expect(res.body.password).toNotExist
      expect(res.body.avatar).toBeDefined()
    })

    it('password should be a hashed password', async () => {
      const user = { ...fakeData.user }
      const res = await request(server).post(usersRoutes.register).send(user)

      const savedUser = await User.findByEmail(user.email)

      expect(savedUser.password).not.toEqual(user.password)
    })

    it('should return 400 if no password given', async () => {
      const user = { name: 'testName', email: 'test@email.com' }
      const res = await request(server).post(usersRoutes.register).send(user)

      expect(res.status).toEqual(400)
      expect(res.body.errors.password).toEqual(`"Password field" is required`)

      const noUser = await User.findByEmail(user.email)
      expect(noUser).toBeNull()
    })

    it('should return 400 if invalid data given', async () => {
      const invalidUser = { name: 'yop', email: 'invalid.com', password: 'test' }
      const res = await request(server).post(usersRoutes.register).send(invalidUser)

      expect(res.status).toEqual(400)
      expect(res.body.errors).toExist
      expect(res.body.errors.name).toEqual(`"Name field" length must be at least 4 characters long`)
      expect(res.body.errors.email).toEqual(`"Email field" must be a valid email`)
      expect(res.body.errors.password).toEqual(`"Password field" length must be at least 6 characters long`)
      
      const noUser = await User.findByEmail(invalidUser.email)
      expect(noUser).toBeNull()
    })

    it('should return 400 if email already in use', async () => {
      const user = await Utils.createUser()
      const invalidUser = { ...fakeData.user }
      invalidUser.email = user.email
      const res = await request(server).post(usersRoutes.register).send(invalidUser)

      expect(res.status).toEqual(400)
      expect(res.body.errors.email).toEqual('Email already exists')
    })
  })

  describe('POST /api/users/login', () => {
    it('should return 400 if user email and password empty', async () => {
      const emptyUser = {}
      const res = await request(server).post(usersRoutes.login).send(emptyUser)

      expect(res.status).toEqual(400)
      expect(res.body.errors.email).toEqual(`"Email field" is required`)
      expect(res.body.errors.password).toEqual(`"Password field" is required`)
    })

    it('shoult return 400 if invalid user email', async () => {
      const user = await Utils.createUser()
      const credentials = { email: 'invalid@email.com', password: fakeData.user.password }
      const res = await request(server).post(usersRoutes.login).send(credentials)
      
      expect(res.status).toEqual(400)
      expect(res.body.errors.auth).toEqual('Incorrect email or password')
    })
    
    it('shoult return 400 if invalid user password', async () => {
      const user = await Utils.createUser()
      const credentials = { email: user.email, password: 'testPassword' }
      const res = await request(server).post(usersRoutes.login).send(credentials)

      expect(res.status).toEqual(400)
      expect(res.body.errors.auth).toEqual('Incorrect email or password')
    })

    it('should return 200 and token if valid credentials', async () => {
      const user = await Utils.createUser()
      const credentials = { email: user.email, password: fakeData.userPassword }
      const res = await request(server).post(usersRoutes.login).send(credentials)
      
      expect(res.status).toEqual(200)
      expect(res.body.token).toBeDefined()
    })
  })

  describe('GET /api/users/itWorks', () => {
    it('should return 200 and message Users Works', async () => {
      const res = await request(server).get(usersRoutes.test)

      expect(res.status).toEqual(200)
      expect(res.body).toExist
      expect(res.body.msg).toEqual('Users Works')
    })
  })
})
