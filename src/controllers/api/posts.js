const Post = require('../../models/Post')

const PostController = {
  itWorks: (req, res, next) => {
    return res.status(200).json({ msg: "Posts Works" })
  },

  getAll: async (req, res, next) => {
    const posts = await Post.find().sort({ date: -1 })

    if (posts.length === 0) {
      return res.status(404).json({ errors: { posts: 'There are no posts' } })
    }

    return res.status(200).json(posts)
  }
}

module.exports = PostController
