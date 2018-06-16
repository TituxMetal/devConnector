const request = require('supertest')
const path = require('path')

const root = path.join(__dirname, '../../../src/')
const data = path.join(__dirname, '../../data/')
const helpers = path.join(__dirname, '../../helpers/')

const server = require(root + 'server')
const { profileRoutes } = require(data + 'routes')
const { Utils , fakeData } = require(helpers + 'utils')

describe('Profile routes', () => {
  afterAll(async () => {
    await Utils.dropDatabase()
    console.log('\n Test database dropped')
    return mongoose.connection.close()
  })

  describe('GET /api/profile', () => {
    it('should return the current logged in user profile', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const profile = await Utils.createProfile(user.id, 'test')
      const res = await request(server).get(profileRoutes.main).set('Authorization', token)

      expect(res.status).toBe(200)
      expect(res.body.handle).toEqual('test')
      expect(res.body.status).toEqual(profile.status)
      expect(res.body.skills).toEqual(expect.arrayContaining(profile.skills))
      expect(res.body.bio).toEqual(profile.bio)
    })

    it('should return 404 if no user profile found', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const res = await request(server).get(profileRoutes.main).set('Authorization', token)

      expect(res.status).toBe(404)
      expect(res.body.errors.profile).toEqual('No profile found')
    })

    it('should return 401 if no token header given', async () => {
      const res = await request(server).get(profileRoutes.main)

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/profile/all', () => {
    beforeAll(async () => fakeData.profiles = [])
    afterAll(async () => await Utils.dropCollection('profiles'))

    it('should return 404 if no user profiles found', async () => {
      await Utils.dropCollection('profiles')
      const res = await request(server).get(profileRoutes.getAll)

      expect(res.status).toBe(404)
      expect(res.body.errors.profile).toEqual('There are no profiles')
    })

    it('should return all profiles', async () => {
      for (let i = 0; i < fakeData.users.length; ++i) {
        await Utils.createProfile(fakeData.users[i].id, 'test' + i)
      }
      const res = await request(server).get(profileRoutes.getAll)

      expect(res.status).toBe(200)
      expect(res.body.length).toBe(fakeData.profiles.length)
    })
  })

  describe('GET /api/profile/handle/:handle', () => {
    it('should return the profile with the given handle', async () => {
      const handle = 'testHandle'
      const user = fakeData.users[0]
      await Utils.createProfile(user.id, handle)
      const res = await request(server).get(profileRoutes.getHandle + handle)

      expect(res.status).toBe(200)
      expect(res.body.handle).toEqual(handle)
    })

    it('should return 404 if given handle was not found', async () => {
      const handle = 'notFoundHandle'
      const res = await request(server).get(profileRoutes.getHandle + handle)

      expect(res.status).toBe(404)
      expect(res.body.errors.handle).toEqual('There is no profile with this handle')
    })
  })

  describe('GET /api/profile/user/:userId', () => {
    it('should return the profile with the given userId', async () => {
      const user = await Utils.createUser()
      await Utils.createProfile(user.id, 'handle')
      const res = await request(server).get(profileRoutes.getUser + user.id)

      expect(res.status).toBe(200)
      expect(res.body.user).toEqual(user.id)
    })

    it('should return 404 if given userId was not found', async () => {
      const user = await Utils.createUser()
      const res = await request(server).get(profileRoutes.getUser + user.id)

      expect(res.status).toBe(404)
      expect(res.body.errors.user).toEqual('There is no profile for this user')
    })
  })

  describe('POST /api/profile/', () => {
    it('should return 401 if no token header given', async () => {
      const res = await request(server).post(profileRoutes.main).send({})

      expect(res.status).toBe(401)
    })

    it('should return 400 if missing required fields', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const requiredFields = ['handle', 'status', 'skills', 'bio']
      const res = await request(server).post(profileRoutes.main).send({}).set('Authorization', token)

      expect(res.status).toEqual(400)
      await requiredFields.map(field => {
        const fieldName = field[0].toUpperCase() + field.slice(1)
        expect(res.body.errors[field]).toEqual(`"${fieldName} field" is required`)
      })
    })

    it('should return 400 if invalid website given', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const profile = { ...fakeData.profile, website: 'invalidUrl' }
      const res = await request(server).post(profileRoutes.main).send(profile).set('Authorization', token)
      
      expect(res.status).toEqual(400)
      expect(res.body.errors.website).toEqual(`"Website field" must be a valid uri`)
    })

    it('should return 400 if invalid socials given', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const socialFields = ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube']
      let social = {}
      socialFields.map(field => {
        social[field] = 'test'
      })
      const profile = { ...fakeData.profile, social }
      const res = await request(server).post(profileRoutes.main).send(profile).set('Authorization', token)

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
      const res = await request(server).post(profileRoutes.main).send(profile).set('Authorization', fakeData.token)

      expect(res.status).toEqual(400)
      fields.map(field => {
        const fieldName = field[0].toUpperCase() + field.slice(1)
        expect(res.body.errors[field]).toEqual(`"${fieldName} field" length must be at least 3 characters long`)
      })
    })

    it('should return 400 if handle length is up to 40 characters long', async () => {
      const longHandle = 'loremipsumdolorsitametconsecteturadipisic'
      const profile = { ...fakeData.profile }
      profile.handle = longHandle
      const res = await request(server).post(profileRoutes.main).send(profile).set('Authorization', fakeData.token)

      expect(res.status).toEqual(400)
      expect(res.body.errors.handle).toEqual(`"Handle field" length must be less than or equal to 40 characters long`)
    })

    it('should create a profile in database', async () => {
      const profile = { ...fakeData.profile }
      profile.handle = 'createProfile'
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const res = await request(server).post(profileRoutes.main).send(profile).set('Authorization', token)
      profile.skills = profile.skills.split(',').map(skill => skill.trim())
      
      expect(res.status).toEqual(200)
      expect(res.body.user).toBeDefined()
      expect(res.body.user).toEqual(user.id)
      expect(res.body.handle).toEqual(profile.handle)
      expect(res.body.skills).toEqual(profile.skills)
      expect(res.body.status).toEqual(profile.status)
      
      const userProfile = await Profile.findByUser(user.id)
      
      expect(userProfile.handle).toEqual(profile.handle)
      expect(userProfile.status).toEqual(profile.status)
      expect(userProfile.bio).toEqual(profile.bio)
      expect(userProfile.user.toString()).toEqual(user.id)
      expect(userProfile.skills).toEqual(expect.arrayContaining(profile.skills))
    })

    it('should return 400 if profile already exists', async () => {
      const user = await Utils.createUser()
      await Utils.createProfile(user, 'testHandle')
      const profile = { ...fakeData.profile }
      const res = await request(server).post(profileRoutes.main).send(profile).set('Authorization', fakeData.token)

      expect(res.status).toBe(400)
      expect(res.body.errors.profile).toEqual('Profile already exists for this user')
    })

    it('should return 400 if handle is already in use', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const profile = { ...fakeData.profile }
      const res = await request(server).post(profileRoutes.main).send(profile).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.handle).toEqual(`Handle already in use`)
    })
  })

  describe('PUT /api/profile/', () => {
    it('should return 404 if profile not found', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const profile = { ...fakeData.profile }
      profile.handle = 'testhandle'
      const res = await request(server).put(profileRoutes.main).send(profile).set('Authorization', token)

      expect(res.status).toBe(404)
      expect(res.body.errors.profile).toEqual('Profile not found')
    })

    it('should edit the profile', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const profile = await Utils.createProfile(user.id, 'testHandle')
      const updatedProfile = {
        handle: 'updatedHandle',
        status: 'updated status',
        website: 'http://fake.com',
        social: { twitter: 'https://twitter.com/test' },
        skills: 'php, javascript, react',
        bio: profile.bio
      }
      const res = await request(server).put(profileRoutes.main).send(updatedProfile).set('Authorization', token)

      expect(res.status).toBe(200)
      expect(res.body.handle).toEqual(updatedProfile.handle)
      expect(res.body.status).toEqual(updatedProfile.status)
      expect(res.body.website).toEqual(updatedProfile.website)
      expect(res.body.social).toEqual(updatedProfile.social)
      expect(res.body.skills.join()).toEqual(updatedProfile.skills)
      expect(res.body.bio).toEqual(updatedProfile.bio)
    })
  })

  describe('DELETE /api/profile', () => {
    it('should delete the profile from the current logged in user', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      await Utils.createProfile(user.id, 'test')
      const res = await request(server).delete(profileRoutes.main).set('Authorization', token)
      const profile = await Profile.findByUser(user.id)

      expect(res.status).toBe(204)
      expect(res.body).toEqual({})
      expect(profile).toBeNull()
    })
  })

  describe('GET /api/profile/itWorks', () => {
    it('should return 200 and message Profile Works', async () => {
      const res = await request(server).get(profileRoutes.test)

      expect(res.status).toEqual(200)
      expect(res.body).toExist
      expect(res.body.msg).toEqual('Profile Works')
    })
  })
})
