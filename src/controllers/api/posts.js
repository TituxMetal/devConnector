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
  },

  create: async (req, res, next) => {
    const post = await new Post({
      user: req.user.id,
      name: req.user.name,
      avatar: req.body.avatar,
      text: req.body.text
    })

    await post.save()

    await res.status(200).json(post)
  },

  comment: async (req, res, next) => {
    await Post.findById(req.params.postId)
      .then(async post => {
        const comment = new Post({
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        })

        post.comments.push(comment)
        await post.save()
          .then(post => res.status(200).json(post))
          .catch(err => res.status(500).json({ server: 'Something went wrong' }))
      })
      .catch(err => res.status(404).json({ errors: { post: 'Post not found' } }))
  },

  like: async (req, res, next) => {
    await Post.findById(req.params.postId)
      .then(async post => {
        const postLikes = post.likes.filter(like => like.user.toString() === req.user.id)
        
        postLikes.length > 0 ? post.likes.pop({ user: req.user.id }) : post.likes.push({ user: req.user.id })

        await post.save()
          .then(post => res.status(200).json(post))
          .catch(err => res.status(500).json({ server: 'Something went wrong' }))
      })
      .catch(err => res.status(404).json({ errors: { post: 'No post found' } }))
  },

  delete: async (req, res, next) => {
    await Post.findById(req.params.postId)
      .then(async post => {
        if (post.user.toString() !== req.user.id) {
          return res.status(403).json( { errors: { notAuthorized: 'User not authorized' } } )
        }

        await post.remove()
          .then(async () => await res.status(204).json({}))
          .catch(err => res.status(500).json({ server: 'Something went wrong' }))
      })
      .catch(err => res.status(404).json({ errors: { post: 'Post not found' } }))
  },

  deleteComment: async (req, res, next) => {
    await Post.findById(req.params.postId)
      .then(async post => {
        const removeIndex = post.comments
          .map(comment => comment.id.toString())
          .indexOf(req.params.commentId)
        
          if (removeIndex < 0) {
            return res.status(404).json({ errors: { comment: 'Comment does not exists' } })
          }

          if (post.comments[removeIndex].user.toString() !== req.user.id) {
            return res.status(403).json({ errors: { notAuthorized: 'User not authorized' } })
          }

          post.comments.splice(removeIndex, 1)
          await post.save()
            .then(post => res.status(200).json(post))
            .catch(err => rest.status(500).json({ server: 'Something went wrong' }))
      })
      .catch(err => res.status(404).json({ errors: { post: 'Post does not exists' } }))
  }
}

module.exports = PostController
