const Profile = require('../../models/Profile')

const ProfileController = {
  itWorks: async (req, res, next) => {
    await res.json({ msg: "Profile Works" })
  },
  current: async (req, res, next) => {
    const profile = await Profile.findByUser(req.user.id)
    
    if (!profile) {
      return res.status(404).json({ errors: { profile: 'No profile found' } })
    }
    await res.status(200).json(profile)
  },
  all: async (req, res, next) => {
    const profiles = await Profile.find().populate('user', [ 'name' ])

    if (profiles.length === 0) {
      return res.status(404).json({ errors: { profile: 'There are no profiles' } })
    }

    await res.status(200).json(profiles)
  },
  handle: async (req, res, next) => {
    const handle = req.params.handle
    const profile = await Profile.findOne({ handle }).populate('user', [ 'name' ])

    if (!profile) {
      return res.status(404).json({ errors: { handle: 'There is no profile with this handle' } })
    }

    await res.status(200).json(profile)
  },
  user: async (req, res, next) => {
    const profile = await Profile.findByUser(req.params.userId)

    if (!profile) {
      return res.status(404).json({ errors: { user: 'There is no profile for this user' } })
    }

    await res.status(200).json(profile)
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
