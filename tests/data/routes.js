const usersUri = '/api/users'
const usersRoutes = {
  main: usersUri,
  register: `${usersUri}/register`,
  login: `${usersUri}/login`,
  current: `${usersUri}/current`,
  test: `${usersUri}/itWorks`
}
const profileUri = '/api/profile'
const profileRoutes = {
  main: profileUri,
  test: `${profileUri}/itWorks`,
  getAll: `${profileUri}/all`,
  getHandle: `${profileUri}/handle/`,
  getUser: `${profileUri}/user/`,
  postExperience: `${profileUri}/experience`,
  postEducation: `${profileUri}/education`,
  deleteExperience: `${profileUri}/experience/`,
  deleteEducation: `${profileUri}/education/`
}
const postsUri = '/api/posts'
const postsRoutes = {
  main: postsUri,
  comment: `${postsUri}/comment/`,
  like: `${postsUri}/like/`,
  getId: `${postsUri}/`,
  deleteId: `${postsUri}/`,
  deleteComment: `${postsUri}/comment/`,
  test: `${postsUri}/itWorks`
}

module.exports = { usersRoutes, profileRoutes, postsRoutes }
