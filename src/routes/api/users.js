const express = require('express')
const router = require('express-promise-router')()

router.get('/itWorks', (req, res, next) => res.json({ msg: "Users Works" }))

module.exports = router
