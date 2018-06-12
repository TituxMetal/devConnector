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

module.exports = { usersRoutes, profileRoutes }
