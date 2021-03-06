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

  describe('POST /api/posts', () => {
    it('should return 401 if no token given', async () => {
      const post = { ...fakeData.post }
      const res = await request(server).post(postsRoutes.main).send({})

      expect(res.status).toBe(401)
    })

    it('should return 400 if missing required fields', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const res = await request(server).post(postsRoutes.main).send({}).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.text).toEqual(`"Text field" is required`)
    })

    it('should return 400 if invalid data given', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const post = { name: 'az', avatar: 'az', text: 'az' }
      const res = await request(server).post(postsRoutes.main).send(post).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.name).toEqual(`"Name field" length must be at least 4 characters long`)
      expect(res.body.errors.text).toEqual(`"Text field" length must be at least 10 characters long`)
      expect(res.body.errors.avatar).toEqual(`"Avatar field" must be a valid uri`)
    })

    it('should create a post in database', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const post = { ...fakeData.post }
      const res = await request(server).post(postsRoutes.main).send(post).set('Authorization', token)

      expect(res.status).toBe(200)
      expect(res.body.user).toEqual(user.id)
      expect(res.body.name).toEqual(user.name)
      expect(res.body.text).toEqual(post.text)
    })
  })

  describe('POST /api/posts/comment/:postId', () => {
    it('should return 401 if no token given', async () => {
      const user = await Utils.createUser()
      const post = await Utils.createPost(user.id, user.name)
      const comment = { ...fakeData.comment, user: user.id, name: user.name }
      const res = await request(server).post(postsRoutes.comment + post.id).send(comment)

      expect(res.status).toBe(401)
      expect(res.body).toEqual({})
    })
    
    it('should return 400 if missing required fields', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const post = await Utils.createPost(user.id, user.name)
      const res = await request(server).post(postsRoutes.comment + post.id).send({}).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.text).toEqual(`"Text field" is required`)
    })

    it('should return 400 if invalid fields given', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const post = await Utils.createPost(user.id, user.name)
      const comment = { text: 'az', name: 'az', avatar: 'az' }
      const res = await request(server).post(postsRoutes.comment + post.id).send(comment).set('Authorization', token)

      expect(res.status).toBe(400)
      expect(res.body.errors.text).toEqual(`"Text field" length must be at least 10 characters long`)
      expect(res.body.errors.name).toEqual(`"Name field" length must be at least 4 characters long`)
      expect(res.body.errors.avatar).toEqual(`"Avatar field" must be a valid uri`)
    })

    it('should return 404 if no post found', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const comment = { ...fakeData.comment, user: user.id, name: user.name }
      const res = await request(server).post(postsRoutes.comment + '123').send(comment).set('Authorization', token)

      expect(res.status).toBe(404)
      expect(res.body.errors.post).toEqual('Post not found')
    })

    it('should add a new comment to a post', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const post = await Utils.createPost(user.id, user.name)
      const comment = { ...fakeData.comment, user: user.id, name: user.name }
      const res = await request(server).post(postsRoutes.comment + post.id).send(comment).set('Authorization', token)

      expect(res.status).toBe(200)
      expect(res.body.comment)
    })
  })

  describe('POST /api/posts/like/:postId', () => {
    it('should return 401 if no token given', async () => {
      const user = await Utils.createUser()
      const post = await Utils.createPost(user.id, user.name)
      const res = await request(server).delete(postsRoutes.deleteId + post.id)

      expect(res.status).toBe(401)
      expect(res.body).toEqual({})
    })

    it('should return 404 if no post', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const res = await request(server).delete(postsRoutes.deleteId + '1234').set('Authorization', token)

      expect(res.status).toBe(404)
      expect(res.body.errors.post).toEqual('Post not found')
    })

    it('should add/remove like on a post', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const post = await Utils.createPost(user.id, user.name)
      const res = await request(server).post(postsRoutes.like + post.id).set('Authorization', token)

      expect(res.status).toBe(200)
      expect(res.body.likes.length).toEqual(1)

      const unlike = await request(server).post(postsRoutes.like + post.id).set('Authorization', token)

      expect(unlike.status).toBe(200)
      expect(unlike.body.likes.length).toEqual(0)
    })
  })

  describe('DELETE /api/posts/:postId', () => {
    it('should return 401 if no token given', async () => {
      const user = await Utils.createUser()
      const post = await Utils.createPost(user.id, user.name)
      const res = await request(server).delete(postsRoutes.deleteId + post.id)

      expect(res.status).toBe(401)
      expect(res.body).toEqual({})
    })

    it('should return 403 if post is from another user', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const anotherUser = await Utils.createUser()
      const post = await Utils.createPost(anotherUser.id, anotherUser.name)
      const res = await request(server).delete(postsRoutes.deleteId + post.id).set('Authorization', token)

      expect(res.status).toBe(403)
      expect(res.body.errors.notAuthorized).toEqual('User not authorized')
    })

    it('should return 404 if post not found', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const res = await request(server).delete(postsRoutes.deleteId + '123').set('Authorization', token)

      expect(res.status).toBe(404)
      expect(res.body.errors.post).toEqual('Post not found')
    })

    it('should delete a post by the given postId', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const post = await Utils.createPost(user.id, user.name)
      const res = await request(server).delete(postsRoutes.deleteId + post.id).set('Authorization', token)
      const p = await Post.findById(post.id)
      
      expect(res.status).toBe(204)
      expect(res.body).toEqual({})
      expect(p).toBeNull()
    })
  })

  describe('DELETE /api/posts/comment/:postId/:commentId', () => {
    it('should return 401 if no token given', async () => {
      const user = await Utils.createUser()
      const post = await Utils.createPost(user.id, user.name)
      const comment = await Utils.createComment(post, user)
      const res = await request(server).delete(postsRoutes.deleteComment + `${post.id}/${comment.id}`)

      expect(res.status).toBe(401)
      expect(res.body).toEqual({})
    })

    it('should return 403 if user not authorized', async () => {
      const user1 = await Utils.createUser()
      const user2 = await Utils.createUser()
      const token = await Utils.loginUser(user2)
      const post = await Utils.createPost(user2.id, user2.name)
      const comment = await Utils.createComment(post, user1)
      const res = await request(server).delete(postsRoutes.deleteComment + `${post.id}/${comment.id}`).set('Authorization', token)

      expect(res.status).toBe(403)
      expect(res.body.errors.notAuthorized).toEqual('User not authorized')
    })

    it('should return 404 if no post found', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const res = await request(server).delete(postsRoutes.deleteComment + '123/123').set('Authorization', token)

      expect(res.status).toBe(404)
      expect(res.body.errors.post).toEqual('Post does not exists')
    })

    it('should return 404 if no comment found', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const post = await Utils.createPost(user.id, user.name)
      const res = await request(server).delete(postsRoutes.deleteComment + post.id + '/123').set('Authorization', token)

      expect(res.status).toBe(404)
      expect(res.body.errors.comment).toEqual('Comment does not exists')
    })

    it('should delete the comment with the given commentId', async () => {
      const user = await Utils.createUser()
      const token = await Utils.loginUser(user)
      const post = await Utils.createPost(user.id, user.name)
      const comment = await Utils.createComment(post, user)
      const res = await request(server).delete(postsRoutes.deleteComment + `${post.id}/${comment.id}`).set('Authorization', token)
      
      expect(res.status).toBe(200)
      expect(res.body.comments.length).toEqual(post.comments.length - 1)

      const com = await Post.findById(post.id)

      expect(com.comments.length).toEqual(post.comments.length - 1)
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
