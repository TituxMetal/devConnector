const request = require('supertest')
const path = require('path')

const root = path.join(__dirname, '../../../src/')
const data = path.join(__dirname, '../../data/')
const helpers = path.join(__dirname, '../../helpers/')

const server = require(root + 'server')
const { profileRoutes } = require(data + 'routes')
const { Utils , fakeData } = require(helpers + 'utils')

describe('Profile education routes', () => {
  afterAll(async () => {
    await Utils.dropDatabase()
    console.log('\n Test database dropped')
    return mongoose.connection.close()
  })

  describe('POST /api/profile/education', () => {
    it('should return 401 if no token given', async () => {
      const user = await Utils.createUser()
      const education = { ...fakeData.education }
      const res = await request(server).post(profileRoutes.postEducation).send(education)

      expect(res.status).toBe(401)
    })

    it('should return 404 if no profile exists', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const education = { ...fakeData.education }
      const res = await request(server).post(profileRoutes.postEducation).send(education).set('Authorization', token)

      expect(res.status).toBe(404)
      expect(res.body.errors.profile).toEqual('A profile must be created before adding education')
    })

    it('should return 400 if missing required field', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      await Utils.createProfile(user, 'test')
      const education = {
        current: true,
        description: 'Education description'
      }
      const res = await request(server).post(profileRoutes.postEducation).send(education).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.school).toEqual(`"School field" is required`)
      expect(res.body.errors.degree).toEqual(`"Degree field" is required`)
      expect(res.body.errors.fieldofstudy).toEqual(`"Field of study field" is required`)
      expect(res.body.errors.from).toEqual(`"From field" is required`)
    })

    it('should return 400 if invalid data given', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      await Utils.createProfile(user, 'test')
      const education = {
        school: 'az',
        degree: 'az',
        fieldofstudy: 'az',
        from: 'az',
        to: 'az',
        current: 'az',
        description: 'az'
      }
      const res = await request(server).post(profileRoutes.postEducation).send(education).set('Authorization', token)

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
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      await Utils.createProfile(user, 'test')
      const education = { ...fakeData.education }
      const res = await request(server).post(profileRoutes.postEducation).send(education).set('Authorization', token)

      expect(res.status).toBe(200)
      expect(res.body.education[0].school).toBe(education.school)
      expect(res.body.education[0].degree).toBe(education.degree)
      expect(res.body.education[0].fieldofstudy).toBe(education.fieldofstudy)
      expect(res.body.education[0].from).not.toBeUndefined()
      expect(res.body.education[0].current).toBe(false)
      expect(res.body.education[0].description).toBe(education.description)
    })
  })

  describe('DELETE /api/profile/education/:educationId', () => {
    it('should delete the education from the profile', async () => {
      const user = await Utils.createUser()
      await Utils.createProfile(user.id, 'test')
      const token = await Utils.loginUser(user)
      const education = { ...fakeData.education }
      const exp = await request(server).post(profileRoutes.postEducation).send(education).set('Authorization', token)
      const expId = exp.body.education[0]._id
      const profile = await Profile.findByUser(user.id)
      const res = await request(server).delete(profileRoutes.deleteEducation + expId).set('Authorization', token)
      
      expect(res.status).toBe(200)
      expect(res.body.education.length).toEqual(profile.education.length - 1)
    })
  })
})
