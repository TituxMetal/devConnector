const Profile = require('../../models/Profile')

const ProfileController = {
  itWorks: async (req, res, next) => {
    await res.json({ msg: "Profile Works" })
  },
  create: async (req, res, next) => {
    const data = req.value.body
    const profile = new Profile(data)
    profile.user = req.user.id

    profile.skills = req.value.body.skills.split(',').map(skill => skill.trim())

    const isProfile = await Profile.findByUser(profile.user)
    if (isProfile) {
      return res.status(400).json({ errors: { profile: 'Profile already exists for this user' } })
    }

    const isHandle = await Profile.findOne({ handle: profile.handle })
    if (isHandle && isHandle.user.id !== profile.user) {
      return res.status(400).json({ errors: { handle: 'Handle already in use' } })
    }

    await profile.save()
    await res.status(200).json(profile)
  },
  edit: async (req, res, next) => {
    const profile = await Profile.findOne({ user: req.user.id })
    
    if (!profile) {
      return res.status(404).json({ errors: { profile: 'Profile not found' } })
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: req.body },
      { new: true }
    )
    await res.status(200).json(updatedProfile)
  }
}

module.exports = ProfileController
