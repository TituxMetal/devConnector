const request = require('supertest')
const faker = require('faker')
const mongoose = require('mongoose')
const path = require('path')

const root = path.join(__dirname, '../../../src')
const server = require(root + '/server')
const User = require(root + '/models/User')

describe('Users route', () => {
  const register = '/api/users/register'
  const test = '/api/users/itWorks'
  const user = {name: faker.name.findName(), email: faker.internet.email(), password: faker.internet.password() }
  const preSave = { name: 'Test name', email: 'sometest@gmail.com', password: 'testPassword'}

  beforeAll(async () => {
    const response = await request(server)
      .post(register)
      .send(preSave)
    
    expect(response.status).toEqual(200)
    expect(response.body).toExist
    expect(response.body.password).not.toBe(preSave.password)
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    console.log('\n Test database dropped')
    return mongoose.connection.close()
  })
  
  describe('POST /api/users/register', () => {
    it('should create new user if email not exists', async () => {
      const res = await request(server).post(register).send(user)
      
      expect(res.status).toEqual(200)
      expect(res.body.name).toEqual(user.name)
      expect(res.body.email).toEqual(user.email)
      expect(res.body.password).toNotExist

      const newUser = await User.find({ email: res.body.email })
      expect(newUser.length).toBe(1)
    })

    it('should create a new user with a hashed password', async () => {
      await request(server).post(register).send(user)

      const savedUser = await User.findByEmail(user.email)
      expect(savedUser.password).not.toEqual(user.password)
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
      const res = await request(server).post(register).send(preSave)

      const existingUser = await User.find({ email: preSave.email })
      expect(existingUser.length).toBe(1)

      expect(res.status).toEqual(400)
      expect(res.body.errors.email).toExist
      expect(res.body.errors.email).toEqual('Email already exists')
    })
  })

  describe('POST /api/users/itWorks', () => {
    it('should return 200 and message Users Works', async () => {
      const res = await request(server).get(test)

      expect(res.status).toEqual(200)
      expect(res.body).toExist
      expect(res.body.msg).toEqual('Users Works')
    })
  })
})
