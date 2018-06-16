const request = require('supertest')
const path = require('path')

const root = path.join(__dirname, '../../../src/')
const data = path.join(__dirname, '../../data/')
const helpers = path.join(__dirname, '../../helpers/')

const server = require(root + 'server')
const { profileRoutes } = require(data + 'routes')
const { Utils , fakeData } = require(helpers + 'utils')

describe('Profile experience routes', () => {
  afterAll(async () => {
    await Utils.dropDatabase()
    console.log('\n Test database dropped')
    return mongoose.connection.close()
  })

  describe('POST /api/profile/experience', () => {
    it('should return 401 if no token given', async () => {
      const user = await Utils.createUser()
      const experience = { ...fakeData.experience }
      const res = await request(server).post(profileRoutes.postExperience).send(experience)

      expect(res.status).toBe(401)
    })

    it('should return 404 if no profile exists', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const experience = { ...fakeData.experience }
      const res = await request(server).post(profileRoutes.postExperience).send(experience).set('Authorization', token)

      expect(res.status).toBe(404)
      expect(res.body.errors.profile).toEqual('A profile must be created before adding experience')
    })

    it('should return 400 if missing required fields', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      await Utils.createProfile(user, 'test')
      const experience = {
        current: true,
        description: 'Experience description'
      }
      const res = await request(server).post(profileRoutes.postExperience).send(experience).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.title).toEqual(`"Title field" is required`)
      expect(res.body.errors.company).toEqual(`"Company field" is required`)
      expect(res.body.errors.from).toEqual(`"From field" is required`)
    })

    it('should return 400 if invalid data given', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      await Utils.createProfile(user, 'test')
      const experience = {
        title: 'az',
        company: 'az',
        location: 'az',
        from: 'az',
        to: 'az',
        current: 'true',
        description: 'az'
      }
      const res = await request(server).post(profileRoutes.postExperience).send(experience).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.title).toEqual(`"Title field" length must be at least 3 characters long`)
      expect(res.body.errors.location).toEqual(`"Location field" length must be at least 3 characters long`)
      expect(res.body.errors.company).toEqual(`"Company field" length must be at least 3 characters long`)
      expect(res.body.errors.from).toEqual(`"From field" must be a number of milliseconds or valid date string`)
      expect(res.body.errors.to).toEqual(`"To field" must be a number of milliseconds or valid date string`)
      expect(res.body.errors.description).toEqual(`"Description field" length must be at least 3 characters long`)
    })

    it('should add an experience in the current logged in user profile', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      await Utils.createProfile(user, 'test')
      const experience = { ...fakeData.experience }
      experience.current = true
      const res = await request(server).post(profileRoutes.postExperience).send(experience).set('Authorization', token)

      expect(res.status).toBe(200)
      expect(res.body.experience[0].title).toBe(experience.title)
      expect(res.body.experience[0].company).toBe(experience.company)
      expect(res.body.experience[0].location).toBe(experience.location)
      expect(res.body.experience[0].from).not.toBeUndefined()
      expect(res.body.experience[0].current).toBe(experience.current)
      expect(res.body.experience[0].description).toBe(experience.description)
    })
  })

  describe('DELETE /api/profile/experience/:experienceId', () => {
    it('should delete the experience from the profile', async () => {
      const user = await Utils.createUser()
      await Utils.createProfile(user.id, 'test')
      const token = await Utils.loginUser(user)
      const experience = { ...fakeData.experience }
      const exp = await request(server).post(profileRoutes.postExperience).send(experience).set('Authorization', token)
      const expId = exp.body.experience[0]._id
      const profile = await Profile.findByUser(user.id)
      const res = await request(server).delete(profileRoutes.deleteExperience + expId).set('Authorization', token)
      
      expect(res.status).toBe(200)
      expect(res.body.experience.length).toEqual(profile.experience.length - 1)
    })
  })
})
