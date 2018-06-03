const Profile = require('../../models/Profile')

const ProfileController = {
  itWorks: async (req, res, next) => {
    await res.json({ msg: "Profile Works" })
  },
  create: async (req, res, next) => {
    const data = req.value.body
    const profile = new Profile(data)
    profile.user = req.user.id
    
    if (typeof profile.skills !== undefined) {
      profile.skills = req.value.body.skills.split(',').map(skill => skill.trim())
    }

    const isProfile = await Profile.findByUser(profile.user)
    if (isProfile) {
      return res.status(400).json({ errors: { profile: 'Profile already exists for this user' } })
    }
    await profile.save()
    await res.status(200).json(profile)
  }
}

module.exports = ProfileController
