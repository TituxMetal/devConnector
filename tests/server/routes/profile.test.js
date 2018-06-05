const request = require('supertest')
const faker = require('faker')
const mongoose = require('mongoose')
const path = require('path')

const root = path.join(__dirname, '../../../src')
const server = require(root + '/server')
const User = require(root + '/models/User')
const Profile = require(root + '/models/Profile')
let userId
let token

describe('Profile route', () => {
  const test = '/api/profile/itWorks'
  const rootUri = '/api/profile/'
  const fakeUser = {
    name: 'Fake User',
    email: faker.internet.email(),
    password: faker.internet.password()
  }
  const fakeProfile = {
    handle: 'fakeHandle',
    status: 'test',
    skills: 'php, css, html',
    bio: 'Fake biography'
  }

  beforeAll(async () => {
    const user = await new User(fakeUser).save()
    userId = user.id
    const login = '/api/users/login'

    const res = await request(server).post(login).send({ email: fakeUser.email, password: fakeUser.password })
    token = `Bearer ${res.body.token}`
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    console.log('\n Test database dropped')
    return mongoose.connection.close()
  })

  describe('POST /api/profile/', () => {
    it('should return 401 if no token header given', async () => {
      const profile = { ...fakeProfile }
      const res = await request(server).post(rootUri).send(profile)

      expect(res.status).toBe(401)
    })

    it('should return 400 if missing required fields', async () => {
      const requiredFields = ['handle', 'status', 'skills', 'bio']
      const res = await request(server).post(rootUri).send({}).set('Authorization', token)

      expect(res.status).toEqual(400)
      requiredFields.map(field => {
        const fieldName = field[0].toUpperCase() + field.slice(1)
        expect(res.body.errors[field]).toEqual(`"${fieldName} field" is required`)
      })
    })

    it('should return 400 if invalid website given', async () => {
      const profile = { ...fakeProfile, website: 'invalid' }
      const res = await request(server).post(rootUri).send(profile).set('Authorization', token)
      
      expect(res.status).toEqual(400)
      expect(res.body.errors.website).toEqual(`"Website field" must be a valid uri`)
    })

    it('should return 400 if invalid socials given', async () => {
      const socialFields = ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube']
      let social = {}
      socialFields.map(field => {
        social[field] = 'test'
      })
      const profile = { ...fakeProfile, social }
      const res = await request(server).post(rootUri).send(profile).set('Authorization', token)

      expect(res.status).toEqual(400)
      socialFields.map(field => {
        const fieldName = field[0].toUpperCase() + field.slice(1)
        expect(res.body.errors[`social.${field}`]).toEqual(`"${fieldName} field" must be a valid uri`)
      })
    })

    it('should return 400 if invalid fields given', async () => {
      const fields = ['handle', 'status', 'skills', 'bio', 'location', 'company', 'githubaccount']
      let invalidFields = {}
      fields.map(field => {
        invalidFields[field] = 'ab'
      })
      const profile = { ...invalidFields }
      const res = await request(server).post(rootUri).send(profile).set('Authorization', token)

      expect(res.status).toEqual(400)
      fields.map(field => {
        const fieldName = field[0].toUpperCase() + field.slice(1)
        expect(res.body.errors[field]).toEqual(`"${fieldName} field" length must be at least 3 characters long`)
      })
    })

    it('should return 400 if handle length is up to 40 characters long', async () => {
      const longHandle = 'loremipsumdolorsitametconsecteturadipisic'
      const { handle, status, skills, bio } = { ...fakeProfile }
      const profile = { handle: longHandle, status, skills, bio }
      const res = await request(server).post(rootUri).send(profile).set('Authorization', token)

      expect(res.status).toEqual(400)
      expect(res.body.errors.handle).toEqual(`"Handle field" length must be less than or equal to 40 characters long`)
    })

    it('should create a profile in database', async () => {
      const profile = { ...fakeProfile }
      const res = await request(server).post(rootUri).send(profile).set('Authorization', token)
      profile.skills = profile.skills.split(',').map(skill => skill.trim())
      
      expect(res.status).toEqual(200)
      expect(res.body.user).toBeDefined()
      expect(res.body.user).toEqual(userId)
      expect(res.body.handle).toEqual(profile.handle)
      expect(res.body.skills).toEqual(profile.skills)
      expect(res.body.status).toEqual(profile.status)
      
      const userProfile = await Profile.findByUser(userId)

      expect(userProfile.handle).toEqual(profile.handle)
      expect(userProfile.status).toEqual(profile.status)
      expect(userProfile.bio).toEqual(profile.bio)
      expect(userProfile.user.toString()).toEqual(userId)
      expect(userProfile.skills).toEqual(expect.arrayContaining(profile.skills))
    })

    it('should return 400 if profile already exists', async () => {
      const profile = { ...fakeProfile }
      const res = await request(server).post(rootUri).send(profile).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.profile).toEqual('Profile already exists for this user')
    })

    it('should return 400 if handle is already in use', async () => {
      const newUser = {
        name: 'Test User',
        email: faker.internet.email(),
        password: faker.internet.password()
      }
      await new User(newUser).save()
      const userLogin = await request(server).post('/api/users/login').send({ email: newUser.email, password: newUser.password })
      const res = await request(server).post(rootUri).send(fakeProfile).set('Authorization', `Bearer ${userLogin.body.token}`)

      expect(res.status).toBe(400)
      expect(res.body.errors.handle).toEqual(`Handle already in use`)
    })
  })

  describe('GET /api/profile', () => {
    it('should return the current logged in user profile', async () => {
      const res = await request(server).get(rootUri).set('Authorization', token)
      const skillsArray = fakeProfile.skills.split(',').map(skill => skill.trim())

      expect(res.status).toBe(200)
      expect(res.body.handle).toEqual(fakeProfile.handle)
      expect(res.body.status).toEqual(fakeProfile.status)
      expect(res.body.skills).toEqual(skillsArray)
      expect(res.body.bio).toEqual(fakeProfile.bio)
    })

    it('should return 404 if no user profile found', async () => {
      const newUser = {
        name: 'test user',
        email: faker.internet.email(),
        password: faker.internet.password()
      }
      await new User(newUser).save()
      const userToken = await request(server).post('/api/users/login').send({ email: newUser.email, password: newUser.password })
      const res = await request(server).get(rootUri).set('Authorization', `Bearer ${userToken.body.token}`)

      expect(res.status).toBe(404)
      expect(res.body.errors.profile).toEqual('No profile found')
    })

    it('should return 401 if no token header given', async () => {
      const res = await request(server).get(rootUri)

      expect(res.status).toBe(401)
    })
  })

  describe('PUT /api/profile/', () => {
    it('should return 404 if profile not found', async () => {
      const newUser = { name: 'test', email: 'test@test.com', password: 'testuser' }
      await new User(newUser).save()
      const token = await request(server).post('/api/users/login').send({ email: newUser.email, password: newUser.password })
      const profile = { ...fakeProfile }
      profile.handle = 'testhandle'
      const res = await request(server).put(rootUri).send(profile).set('Authorization', `Bearer ${token.body.token}`)

      expect(res.status).toBe(404)
      expect(res.body.errors.profile).toEqual('Profile not found')
    })

    it('should edit the profile', async () => {
      const profile = { ...fakeProfile }
      profile.status = 'updated status'
      profile.website = 'http://fake.com'
      profile.social = { twitter: 'https://twitter.com/test' }
      const res = await request(server).put(rootUri).send(profile).set('Authorization', token)

      expect(res.status).toBe(200)
      expect(res.body.handle).toEqual(profile.handle)
      expect(res.body.status).toEqual(profile.status)
      expect(res.body.website).toEqual(profile.website)
      expect(res.body.social).toEqual(profile.social)
    })
  })

  describe('GET /api/profile/itWorks', () => {
    it('should return 200 and message Profile Works', async () => {
      const res = await request(server).get(test)

      expect(res.status).toEqual(200)
      expect(res.body).toExist
      expect(res.body.msg).toEqual('Profile Works')
    })
  })
})
