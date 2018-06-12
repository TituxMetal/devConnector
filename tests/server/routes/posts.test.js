const request = require('supertest')
const path = require('path')

const root = path.join(__dirname, '../../../src/')
const data = path.join(__dirname, '../../data/')

const server = require(root + 'server')
const { postsRoutes } = require(data + 'routes')

describe('GET /api/posts/itWorks', () => {
  describe('GET /api/posts/itWorks', () => {
    it('should return 200 and message Posts Works', async () => {
      const res = await request(server).get(postsRoutes.test)

      expect(res.status).toEqual(200)
      expect(res.body).toExist
      expect(res.body.msg).toEqual('Posts Works')
    })
  })
})
