const express = require("express");
const router = express.Router(); //so that we can access :id from parent route
const wrapAsync = require("../utils/wrapAsync");

const ExpressError = require("../utils/ExpressError");
const User = require("../models/user");
const passport = require("passport");

//signup routes
router.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});
router.post(
  "/signup",
  wrapAsync(async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const user = new User({ username, email });
      const registeredUser = await User.register(user, password);
      console.log(registeredUser);
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  })
);

//login routes
router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  wrapAsync(async (req, res) => {
    req.flash("success", "welcome back!");
    res.redirect("/listings");
  })
);

module.exports = router;
