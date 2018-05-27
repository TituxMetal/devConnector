const request = require('supertest')
const faker = require('faker')
const mongoose = require('mongoose')
const path = require('path')

const root = path.join(__dirname, '../../../src')
const server = require(root + '/server')

describe('Profile route', () => {
  const test = '/api/profile/itWorks'
  
  describe('GET /api/profile/itWorks', () => {
    it('should return 200 and message Profile Works', async () => {
      const res = await request(server).get(test)
  
      expect(res.status).toEqual(200)
      expect(res.body).toExist
      expect(res.body.msg).toEqual('Profile Works')
    })
  })
})
