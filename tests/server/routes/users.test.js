const request = require('supertest')
const path = require('path')

const root = path.join(__dirname, '../../../src')
const server = require(root + '/server')

describe('Users route', () => {
  const test = '/api/users/itWorks'

  describe('POST /api/users/test', () => {
    it('should return 200 and message Users Works', async () => {
      const res = await request(server).get(test)

      expect(res.status).toEqual(200)
      expect(res.body).toExist
      expect(res.body.msg).toEqual('Users Works')
    })
  })
})
