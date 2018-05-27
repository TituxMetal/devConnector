const ProfileController = {
  itWorks: async (req, res, next) => {
    await res.json({ msg: "Profile Works" })
  }
}

module.exports = ProfileController
