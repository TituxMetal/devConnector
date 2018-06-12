const request = require('supertest')
const path = require('path')

const root = path.join(__dirname, '../../../src/')
const data = path.join(__dirname, '../../data/')
const helpers = path.join(__dirname, '../../helpers/')

const server = require(root + 'server')
const { postsRoutes } = require(data + 'routes')
const { Utils , fakeData } = require(helpers + 'utils')

describe('Posts routes', () => {
  afterAll(async () => {
    await Utils.dropDatabase()
    console.log('\n Test database dropped')
    return mongoose.connection.close()
  })

  describe('GET /api/posts', () => {
    afterAll(async () => await Utils.dropCollection('posts'))

    it('should return 404 if no posts found', async () => {
      const res = await request(server).get(postsRoutes.main)

      expect(res.status).toBe(404)
      expect(res.body.errors.posts).toEqual('There are no posts')
    })

    it('should return all posts', async () => {
      const user = await Utils.createUser()
      await Utils.createPost(user.id, user.name)
      await Utils.createPost(user.id, user.name)
      await Utils.createPost(user.id, user.name)
      const res = await request(server).get(postsRoutes.main)
  
      expect(res.status).toBe(200)
      expect(res.body.length).toEqual(fakeData.posts.length)
    })
  })

  describe('GET /api/posts/:postId', () => {
    it('should return 404 if no post with the given postId', async () => {
      const postId = fakeData.posts[0].id
      const res = await request(server).get(postsRoutes.getId + postId)
      
      expect(res.status).toBe(404)
      expect(res.body.errors.post).toEqual('There is no post')
    })

    it('should return post with the given postId', async () => {
      const user = await Utils.createUser()
      const post = await Utils.createPost(user.id, user.name)
      const res = await request(server).get(postsRoutes.getId + post.id)

      expect(res.status).toBe(200)
      expect(res.body.user).toEqual(user.id)
      expect(res.body.text).toEqual(post.text)
      expect(res.body.name).toEqual(post.name)
      expect(res.body.avatar).toEqual(post.avatar)
    })
  })

  describe('GET /api/posts/itWorks', () => {
    it('should return 200 and message Posts Works', async () => {
      const res = await request(server).get(postsRoutes.test)

      expect(res.status).toEqual(200)
      expect(res.body).toExist
      expect(res.body.msg).toEqual('Posts Works')
    })
  })
})
