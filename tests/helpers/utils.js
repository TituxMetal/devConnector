const request = require('supertest')
const mongoose = require('mongoose')
const faker = require('faker')
const path = require('path')

const root = path.join(__dirname, '../../src/')
const data = path.join(__dirname, '../data/')

const server = require(root + 'server')
const { usersRoutes, pofileRoutes } = require(data + 'routes')
const User = require(root + 'models/User')
const Profile = require(root + 'models/Profile')
const Post = require(root + 'models/Post')

const fakeData = {
  token: 'Bearer ',
  users: [],
  profiles: [],
  posts: [],
  userPassword: faker.internet.password(),
  user: {
    name: faker.internet.userName(),
    email: faker.internet.email(),
    password: 'fakeTestPassword'
  },
  profile: {
    handle: 'testHandle',
    status: 'test',
    skills: 'php, css, html',
    bio: 'Fake biography'
  },
  experience: {
    title: 'Experience title',
    company: faker.company.companyName(),
    location: faker.address.city(),
    from: faker.date.past(5, new Date()),
    description: faker.lorem.paragraph()
  },
  education: {
    school: 'School name',
    degree: 'Education degree',
    fieldofstudy: 'Field of study',
    from: faker.date.past(5, new Date()),
    description: faker.lorem.paragraph()
  },
  post: {
    text: faker.lorem.paragraph()
  },
  comment: {
    text: faker.lorem.paragraph(),
    avatar: 'https://gravatar.com/avatar'
  }
}

const Utils = {
  dropDatabase: async () => {
    await mongoose.connection.dropDatabase()
  },

  dropCollection: async name => {
    await mongoose.connection.dropCollection(name)
  },

  loginUser: async user => {
    const login = usersRoutes.login
    const res = await request(server).post(login).send({ email: user.email, password: fakeData.userPassword })
    return fakeData.token = `Bearer ${res.body.token}`
  },

  createUser: async () => {
    const user = await new User({
      name: faker.internet.userName(),
      email: faker.internet.email(),
      password: fakeData.userPassword
    }).save()
    fakeData.users.push(user)
    return user
  },

  createProfile: async (userId, handle) => {
    const profile = await new Profile({
      user: userId,
      handle: handle,
      status: 'testStatus',
      skills: 'php, html, css',
      bio: 'Fake biography for the test'
    }).save()
    fakeData.profiles.push(profile)
    return profile
  },

  createPost: async (userId, userName) => {
    const post = await new Post({
      user: userId,
      text: faker.lorem.paragraph(),
      name: userName,
      avatar: 'https://gravatar.com/avatar'
    }).save()
    fakeData.posts.push(post)
    return post
  },

  createComment: async (post, user) => {
    const comment = {
      user: user.id,
      name: user.name,
      text: faker.lorem.paragraph(),
      avatar: 'https://gravatar.com/avatar'
    }
    post.comments.push(comment)
    await post.save()
    const commentIndex = post.comments.length - 1
    return post.comments[commentIndex]
  }
}

module.exports = { Utils , fakeData }
