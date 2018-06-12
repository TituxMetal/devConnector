const Post = require('../../models/Post')

const PostController = {
  itWorks: async (req, res, next) => {
    await res.status(200).json({ msg: "Posts Works" })
  },

  getAll: async (req, res, next) => {
    const posts = await Post.find().sort({ date: -1 })

    if (posts.length === 0) {
      return res.status(404).json({ errors: { posts: 'There are no posts' } })
    }

    await res.status(200).json(posts)
  },

  getId: async (req, res, next) => {
    const post = await Post.findById(req.params.postId)

    if (!post) {
      return res.status(404).json({ errors: { post: 'There is no post' } })
    }

    await res.status(200).json(post)
  }
}

module.exports = PostController
