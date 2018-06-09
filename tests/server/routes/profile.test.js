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
  const getHandle = `${uri}/handle/`
  const getUser = `${uri}/user/`
  const postExp = `${uri}/experience`
  const postEdu = `${uri}/education`
  const deleteExp = `${uri}/experience/`

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

  describe('POST /api/profile/experience', () => {
    beforeAll(async () => profiles = [])
    afterAll(async () => await dropCollection('profiles'))

    it('should return 401 if no token given', async () => {
      await createUser()
      const experience = {
        title: 'Experience title',
        company: faker.company.companyName(),
        location: faker.address.city(),
        from: faker.date.past(5, new Date()),
        current: true,
        description: faker.lorem.paragraph()
      }
      const user = users[users.length - 1]
      const res = await request(server).post(postExp).send(experience)

      expect(res.status).toBe(401)
    })

    it('should return 404 if no profile exists', async () => {
      await createUser()
      const experience = {
        title: 'Experience title',
        company: faker.company.companyName(),
        location: faker.address.city(),
        from: faker.date.past(5, new Date()),
        current: true,
        description: faker.lorem.paragraph()
      }
      const user = users[users.length - 1]
      const token = await request(server).post('/api/users/login').send({ email: user.email, password: userPassword })
      const res = await request(server).post(postExp).send(experience).set('Authorization', `Bearer ${token.body.token}`)

      expect(res.status).toBe(404)
      expect(res.body.errors.profile).toEqual('A profile must be created before adding experience')
    })

    it('should return 400 if missing required fields', async () => {
      const userId = users[0].id
      await createProfile(userId, 'test')
      const experience = {
        current: true,
        description: faker.lorem.paragraph()
      }
      const res = await request(server).post(postExp).send(experience).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.title).toEqual(`"Title field" is required`)
      expect(res.body.errors.company).toEqual(`"Company field" is required`)
      expect(res.body.errors.from).toEqual(`"From field" is required`)
    })

    it('should return 400 if invalid data given', async () => {
      const userId = users[0].id
      await createProfile(userId, 'test')
      const experience = {
        title: 'az',
        company: 'az',
        location: 'az',
        from: 'az',
        to: 'az',
        current: 'true',
        description: 'az'
      }
      const res = await request(server).post(postExp).send(experience).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.title).toEqual(`"Title field" length must be at least 3 characters long`)
      expect(res.body.errors.location).toEqual(`"Location field" length must be at least 3 characters long`)
      expect(res.body.errors.company).toEqual(`"Company field" length must be at least 3 characters long`)
      expect(res.body.errors.from).toEqual(`"From field" must be a number of milliseconds or valid date string`)
      expect(res.body.errors.to).toEqual(`"To field" must be a number of milliseconds or valid date string`)
      expect(res.body.errors.description).toEqual(`"Description field" length must be at least 3 characters long`)
    })

    it('should add an experience in the current logged in user profile', async () => {
      const userId = users[0].id
      await createProfile(userId, 'test')
      const experience = {
        title: 'Experience title',
        company: faker.company.companyName(),
        location: faker.address.city(),
        from: faker.date.past(5, new Date()),
        current: true,
        description: faker.lorem.paragraph()
      }
      const res = await request(server).post(postExp).send(experience).set('Authorization', token)

      expect(res.status).toBe(200)
      expect(res.body.experience[0].title).toBe(experience.title)
      expect(res.body.experience[0].company).toBe(experience.company)
      expect(res.body.experience[0].location).toBe(experience.location)
      expect(res.body.experience[0].from).not.toBeUndefined()
      expect(res.body.experience[0].current).toBe(experience.current)
      expect(res.body.experience[0].description).toBe(experience.description)
    })
  })

  describe('POST /api/profile/education', () => {
    beforeAll(async () => profiles = [])
    afterAll(async () => await dropCollection('profiles'))

    it('should return 401 if no token given', async () => {
      await createUser()
      const newEducation = {
        school: 'School name',
        degree: 'Education degree',
        fieldofstudy: 'Field of study',
        description: faker.lorem.paragraph(),
        from: faker.date.past(5, new Date())
      }
      const res = await request(server).post(postEdu).send(newEducation)

      expect(res.status).toBe(401)
    })

    it('should return 404 if no profile exists', async () => {
      await createUser()
      const newEducation = {
        school: 'School name',
        degree: 'Education degree',
        fieldofstudy: 'Field of study',
        description: faker.lorem.paragraph(),
        from: faker.date.past(5, new Date())
      }
      const user = users[users.length - 1]
      const token = await request(server).post('/api/users/login').send({ email: user.email, password: userPassword })
      const res = await request(server).post(postEdu).send(newEducation).set('Authorization', `Bearer ${token.body.token}`)

      expect(res.status).toBe(404)
      expect(res.body.errors.profile).toEqual('A profile must be created before adding education')
    })

    it('should return 400 if missing required field', async () => {
      const userId = users[0].id
      await createProfile(userId, 'test')
      const newEducation = {
        current: true,
        description: faker.lorem.paragraph()
      }
      const res = await request(server).post(postEdu).send(newEducation).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.school).toEqual(`"School field" is required`)
      expect(res.body.errors.degree).toEqual(`"Degree field" is required`)
      expect(res.body.errors.fieldofstudy).toEqual(`"Field of study field" is required`)
      expect(res.body.errors.from).toEqual(`"From field" is required`)
    })

    it('should return 400 if invalid data given', async () => {
      const userId = users[0].id
      await createProfile(userId, 'test')
      const newEducation = {
        school: 'az',
        degree: 'az',
        fieldofstudy: 'az',
        from: 'az',
        to: 'az',
        current: 'az',
        description: 'az'
      }
      const res = await request(server).post(postEdu).send(newEducation).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.school).toEqual(`"School field" length must be at least 3 characters long`)
      expect(res.body.errors.degree).toEqual(`"Degree field" length must be at least 3 characters long`)
      expect(res.body.errors.fieldofstudy).toEqual(`"Field of study field" length must be at least 3 characters long`)
      expect(res.body.errors.current).toEqual(`"Current field" must be a boolean`)
      expect(res.body.errors.from).toEqual(`"From field" must be a number of milliseconds or valid date string`)
      expect(res.body.errors.to).toEqual(`"To field" must be a number of milliseconds or valid date string`)
      expect(res.body.errors.description).toEqual(`"Description field" length must be at least 3 characters long`)
    })

    it('should add an education in the current logged in user profile', async () => {
      const userId = users[0].id
      await createProfile(userId, 'test')
      const newEducation = {
        school: 'School name',
        degree: 'Education degree',
        fieldofstudy: 'Field of study',
        description: faker.lorem.paragraph(),
        from: faker.date.past(5, new Date())
      }
      const res = await request(server).post(postEdu).send(newEducation).set('Authorization', token)

      expect(res.status).toBe(200)
      expect(res.body.education[0].school).toBe(newEducation.school)
      expect(res.body.education[0].degree).toBe(newEducation.degree)
      expect(res.body.education[0].fieldofstudy).toBe(newEducation.fieldofstudy)
      expect(res.body.education[0].from).not.toBeUndefined()
      expect(res.body.education[0].current).toBe(false)
      expect(res.body.education[0].description).toBe(newEducation.description)
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

  describe('GET /api/profile/handle/:handle', () => {
    beforeAll(async () => profiles = [])
    afterAll(async () => await dropCollection('profiles'))

    it('should return the profile with the given handle', async () => {
      const handle = 'testHandle'
      const user = users[0]
      await createProfile(user.id, handle)
      const res = await request(server).get(getHandle + handle)

      expect(res.status).toBe(200)
      expect(res.body.handle).toEqual(handle)
    })

    it('should return 404 if given handle was not found', async () => {
      const handle = 'notFoundHandle'
      const res = await request(server).get(getHandle + handle)

      expect(res.status).toBe(404)
      expect(res.body.errors.handle).toEqual('There is no profile with this handle')
    })
  })

  describe('GET /api/profile/user/:userId', () => {
    beforeAll(async () => profiles = [])
    afterAll(async () => await dropCollection('profiles'))

    it('should return the profile with the given userId', async () => {
      const user = users[0]
      await createProfile(user.id, 'handle')
      const res = await request(server).get(getUser + user.id)

      expect(res.status).toBe(200)
      expect(res.body.user).toEqual(user.id)
    })

    it('should return 404 if given userId was not found', async () => {
      await createUser()
      const userId = users[users.length - 1].id
      const res = await request(server).get(getUser + userId)

      expect(res.status).toBe(404)
      expect(res.body.errors.user).toEqual('There is no profile for this user')
    })
  })

  describe('GET /api/profile/all', () => {
    beforeAll(async () => profiles = [])
    afterAll(async () => await dropCollection('profiles'))

    it('should return 404 if no user profiles found', async () => {
      const res = await request(server).get(getAll)

      expect(res.status).toBe(404)
      expect(res.body.errors.profile).toEqual('There are no profiles')
    })

    it('should return all profiles', async () => {
      for (let i = 0; i < users.length; ++i) {
        await createProfile(users[i].id, 'test' + i)
      }

      const res = await request(server).get(getAll)

      expect(res.status).toBe(200)
      expect(res.body.length).toBe(profiles.length)
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

  describe('DELETE /api/profile', () => {
    beforeAll(async () => profiles = [])
    afterAll(async () => await dropCollection('profiles'))

    it('should delete the profile from the current logged in user', async () => {
      const user = users[0]
      await createProfile(user.id, 'test')
      const res = await request(server).delete(uri).set('Authorization', token)
      const profile = await Profile.findByUser(user.id)

      expect(res.status).toBe(204)
      expect(res.body).toEqual({})
      expect(profile).toBeNull()
    })
  })

  describe('DELETE /api/profile/experience/:experienceId', () => {
    beforeAll(async () => profiles = [])
    afterAll(async () => await dropCollection('profiles'))

    it('should delete the experience from the profile', async () => {
      const user = users[0]
      await createProfile(user.id, 'test')
      const experience = {
        title: 'Experience title',
        company: faker.company.companyName(),
        location: faker.address.city(),
        from: faker.date.past(5, new Date()),
        description: faker.lorem.paragraph()
      }
      const newExperience = await request(server).post(postExp).send(experience).set('Authorization', token)
      const exp = newExperience.body.experience[0]
      const profile = await Profile.findByUser(user.id)
      const res = await request(server).delete(deleteExp + exp._id).set('Authorization', token)
      
      expect(res.status).toBe(200)
      expect(res.body.experience.length).toEqual(profile.experience.length - 1)
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
