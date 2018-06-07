const request = require('supertest')
const faker = require('faker')
const mongoose = require('mongoose')
const path = require('path')

const root = path.join(__dirname, '../../../src')
const server = require(root + '/server')
const User = require(root + '/models/User')
const Profile = require(root + '/models/Profile')
let userPassword = faker.internet.password()
let users = []
let profiles = []
let token

describe('Profile route', () => {
  const uri = '/api/profile'
  const test = `${uri}/itWorks`
  const getAll = `${uri}/all`

  const dropDatabase = async () => {
    await mongoose.connection.dropDatabase()
    console.log('\n Test database dropped')
  }

  const dropCollection = async (name) => {
    await mongoose.connection.dropCollection(name)
  }

  const createUser = async () => {
    const user = await new User({
      name: faker.internet.userName(),
      email: faker.internet.email(),
      password: userPassword
    }).save()
    users.push(user)
  }

  const createProfile = async (userId, handle) => {
    const profile = await new Profile({
      user: userId,
      handle: handle,
      status: 'testStatus',
      skills: 'php, html, css',
      bio: 'Fake biography for the test'
    }).save()
    profiles.push(profile)
  }
  
  const fakeProfile = {
    status: 'test',
    skills: 'php, css, html',
    bio: 'Fake biography'
  }

  beforeAll(async () => {
    await createUser()
    console.log(`User Created`)
    const user = users[0]

    const login = '/api/users/login'
    const res = await request(server).post(login).send({ email: user.email, password: userPassword })
    token = `Bearer ${res.body.token}`
    console.log('User Logged in')
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    console.log('\n Test database dropped')
    return mongoose.connection.close()
  })

  describe('POST /api/profile/', () => {
    beforeAll(async () => profiles = [])
    afterAll(async () => await dropCollection('profiles'))

    it('should return 401 if no token header given', async () => {
      const res = await request(server).post(uri).send({})

      expect(res.status).toBe(401)
    })

    it('should return 400 if missing required fields', async () => {
      const requiredFields = ['handle', 'status', 'skills', 'bio']
      const res = await request(server).post(uri).send({}).set('Authorization', token)

      expect(res.status).toEqual(400)
      requiredFields.map(field => {
        const fieldName = field[0].toUpperCase() + field.slice(1)
        expect(res.body.errors[field]).toEqual(`"${fieldName} field" is required`)
      })
    })

    it('should return 400 if invalid website given', async () => {
      const profile = { handle: 'test', ...fakeProfile, website: 'invalid' }
      const res = await request(server).post(uri).send(profile).set('Authorization', token)
      
      expect(res.status).toEqual(400)
      expect(res.body.errors.website).toEqual(`"Website field" must be a valid uri`)
    })

    it('should return 400 if invalid socials given', async () => {
      const socialFields = ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube']
      let social = {}
      socialFields.map(field => {
        social[field] = 'test'
      })
      const profile = { handle: 'test', ...fakeProfile, social }
      const res = await request(server).post(uri).send(profile).set('Authorization', token)

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
      const res = await request(server).post(uri).send(profile).set('Authorization', token)

      expect(res.status).toEqual(400)
      fields.map(field => {
        const fieldName = field[0].toUpperCase() + field.slice(1)
        expect(res.body.errors[field]).toEqual(`"${fieldName} field" length must be at least 3 characters long`)
      })
    })

    it('should return 400 if handle length is up to 40 characters long', async () => {
      const longHandle = 'loremipsumdolorsitametconsecteturadipisic'
      const { status, skills, bio } = { ...fakeProfile }
      const profile = { handle: longHandle, status, skills, bio }
      const res = await request(server).post(uri).send(profile).set('Authorization', token)

      expect(res.status).toEqual(400)
      expect(res.body.errors.handle).toEqual(`"Handle field" length must be less than or equal to 40 characters long`)
    })

    it('should create a profile in database', async () => {
      const profile = { handle: 'test', ...fakeProfile }
      const userId = users[0].id
      const res = await request(server).post(uri).send(profile).set('Authorization', token)
      profile.skills = profile.skills.split(',').map(skill => skill.trim())
      profiles.push(profile)
      
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
      const profile = { handle: 'test', ...fakeProfile }
      const res = await request(server).post(uri).send(profile).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.profile).toEqual('Profile already exists for this user')
    })

    it('should return 400 if handle is already in use', async () => {
      await createUser()
      const newUser = users[users.length - 1]
      const userLogin = await request(server).post('/api/users/login').send({ email: newUser.email, password: userPassword })
      const profile = { handle: 'test', ...fakeProfile }
      const res = await request(server).post(uri).send(profile).set('Authorization', `Bearer ${userLogin.body.token}`)

      expect(res.status).toBe(400)
      expect(res.body.errors.handle).toEqual(`Handle already in use`)
    })
  })

  describe('GET /api/profile', () => {
    beforeAll(async () => profiles = [])
    afterAll(async () => await dropCollection('profiles'))

    it('should return the current logged in user profile', async () => {
      await createProfile(users[0].id, 'test')
      profile = profiles[profiles.length - 1]
      const res = await request(server).get(uri).set('Authorization', token)

      expect(res.status).toBe(200)
      expect(res.body.handle).toEqual('test')
      expect(res.body.status).toEqual(profile.status)
      expect(res.body.skills).toEqual(expect.arrayContaining(profile.skills))
      expect(res.body.bio).toEqual(profile.bio)
    })

    it('should return 404 if no user profile found', async () => {
      await createUser()
      const newUser = users[users.length - 1]
      const userToken = await request(server).post('/api/users/login').send({ email: newUser.email, password: userPassword })
      const res = await request(server).get(uri).set('Authorization', `Bearer ${userToken.body.token}`)

      expect(res.status).toBe(404)
      expect(res.body.errors.profile).toEqual('No profile found')
    })

    it('should return 401 if no token header given', async () => {
      const res = await request(server).get(uri)

      expect(res.status).toBe(401)
    })
  })

  describe('PUT /api/profile/', () => {
    beforeAll(async () => profiles = [])
    afterAll(async () => await dropCollection('profiles'))

    it('should return 404 if profile not found', async () => {
      await createUser()
      const newUser = users[users.length -1]
      const token = await request(server).post('/api/users/login').send({ email: newUser.email, password: userPassword })
      const profile = { ...fakeProfile }
      profile.handle = 'testhandle'
      const res = await request(server).put(uri).send(profile).set('Authorization', `Bearer ${token.body.token}`)

      expect(res.status).toBe(404)
      expect(res.body.errors.profile).toEqual('Profile not found')
    })

    it('should edit the profile', async () => {
      await createProfile(users[0].id, 'test')
      const p = profiles[profiles.length - 1]
      const profile = {
        handle: 'testHandle',
        status: 'updated status',
        website: 'http://fake.com',
        social: { twitter: 'https://twitter.com/test' },
        skills: 'php, javascript, react',
        bio: p.bio
      }
      const res = await request(server).put(uri).send(profile).set('Authorization', token)

      expect(res.status).toBe(200)
      expect(res.body.handle).toEqual(profile.handle)
      expect(res.body.status).toEqual(profile.status)
      expect(res.body.website).toEqual(profile.website)
      expect(res.body.social).toEqual(profile.social)
      expect(res.body.skills.join()).toEqual(profile.skills)
      expect(res.body.bio).toEqual(profile.bio)
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
