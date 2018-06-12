
const PostController = {
  itWorks: (req, res, next) => {
    return res.status(200).json({ msg: "Posts Works" })
  }
}

module.exports = PostController
