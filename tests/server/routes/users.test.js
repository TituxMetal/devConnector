const request = require('supertest')
const faker = require('faker')
const mongoose = require('mongoose')
const path = require('path')

const root = path.join(__dirname, '../../../src')
const server = require(root + '/server')
const User = require(root + '/models/User')

describe('Users route', () => {
  const register = '/api/users/register'
  const login = '/api/users/login'
  const current = '/api/users/current'
  const test = '/api/users/itWorks'
  const user = { email: faker.internet.email(), password: faker.internet.password() }
  const preSave = { email: 'sometest@gmail.com', password: 'testPassword'}

  beforeAll(async () => {
    const testUser = { ...preSave }
    testUser.name = 'Test name'
    const response = await request(server)
      .post(register)
      .send(testUser)

    expect(response.status).toEqual(200)
    expect(response.body).toExist
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    console.log('\n Test database dropped')
    return mongoose.connection.close()
  })
  
  describe('POST /api/users/register', () => {
    it('should create new user if email not exists', async () => {
      const testUser = { ...user }
      testUser.name = faker.name.findName()
      const res = await request(server).post(register).send(testUser)

      expect(res.status).toEqual(200)
      expect(res.body.name).toEqual(testUser.name)
      expect(res.body.email).toEqual(testUser.email)
      expect(res.body.password).toNotExist

      const newUser = await User.find({ email: res.body.email })
      expect(newUser.length).toBe(1)
    })

    it('password should be a hashed password', async () => {
      const savedUser = await User.findByEmail(preSave.email)

      expect(savedUser.password).not.toEqual(preSave.password)
    })

    it('should return 400 if no password given', async () => {
      const invalidUser = { name: 'Invalid', email: 'inval@id.com' }
      const res = await request(server).post(register).send(invalidUser)

      expect(res.status).toEqual(400)
      expect(res.body.errors.password).toExist
      expect(res.body.errors.password).toEqual(`"Password field" is required`)

      const noUser = await User.findByEmail(invalidUser.email)
      expect(noUser).toBe(null)
    })

    it('should return 400 if invalid data given', async () => {
      const invalidUser = { name: 'yop', email: 'invalid.com', password: 'test' }
      const res = await request(server).post(register).send(invalidUser)

      expect(res.status).toEqual(400)
      expect(res.body.errors).toExist
      expect(res.body.errors.name).toEqual(`"Name field" length must be at least 4 characters long`)
      expect(res.body.errors.email).toEqual(`"Email field" must be a valid email`)
      expect(res.body.errors.password).toEqual(`"Password field" length must be at least 6 characters long`)

      const noUser = await User.findByEmail(invalidUser.email)
      expect(noUser).toBe(null)
    })

    it('should return 400 if email already in use', async () => {
      const existUser = { ...preSave }
      existUser.name = 'Fake Name'
      const res = await request(server).post(register).send(existUser)

      const existingUser = await User.find({ email: existUser.email })
      expect(existingUser.length).toBe(1)

      expect(res.status).toEqual(400)
      expect(res.body.errors.email).toExist
      expect(res.body.errors.email).toEqual('Email already exists')
    })
  })

  describe('POST /api/users/login', () => {
    it('should return 400 if user email and password empty', async () => {
      const emptyUser = {}
      const res = await request(server).post(login).send(emptyUser)

      expect(res.status).toEqual(400)
      expect(res.body.errors.email).toEqual(`"Email field" is required`)
      expect(res.body.errors.password).toEqual(`"Password field" is required`)
    })

    it('shoult return 400 if invalid user email', async () => {
      const invalidUserEmail = { ...preSave }
      invalidUserEmail.email = 'invalid@mail.com'
      const res = await request(server).post(login).send(invalidUserEmail)
  
      expect(res.status).toEqual(400)
      expect(res.body.errors.auth).toEqual('Incorrect email or password')
    })

    it('shoult return 400 if invalid user password', async () => {
      const invalidUserPassword = { ...preSave }
      invalidUserPassword.password = 'invalidPassword'
      const res = await request(server).post(login).send(invalidUserPassword)

      expect(res.status).toEqual(400)
      expect(res.body.errors.auth).toEqual('Incorrect email or password')
    })

    it('should return 200 and token if valid credentials', async () => {
      const res = await request(server).post(login).send(preSave)
      expect(res.status).toEqual(200)
      expect(res.body.token).toExist
    })
  })
  
  describe('GET /api/users/current', () => {
    beforeAll(async () => {
      const res = await request(server).post(login).send(preSave)

      expect(res.status).toEqual(200)
      expect(res.body.token).toExist
      token = res.body.token
    })

    it('should return 401 if invalid token', async () => {
      let invalidToken = 'invalidTokenForTesting'
      const res = await request(server).get(current).set('Authorization', `Bearer ${invalidToken}`)

      expect(res.status).toEqual(401)
    })

    it('should return 401 if no token', async () => {
      const res = await request(server).get(current)

      expect(res.status).toEqual(401)
    })

    it('should return 200 and user info if ok', async () => {
      const res = await request(server).get(current).set('Authorization', `Bearer ${token}`)

      expect(res.status).toEqual(200)
      expect(res.body.name).toEqual('Test name')
      expect(res.body.email).toEqual(preSave.email)
    })
  })

  describe('GET /api/users/itWorks', () => {
    it('should return 200 and message Users Works', async () => {
      const res = await request(server).get(test)

      expect(res.status).toEqual(200)
      expect(res.body).toExist
      expect(res.body.msg).toEqual('Users Works')
    })
  })
})
