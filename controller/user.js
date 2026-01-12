const User = require("../models/user");
// signup routes
module.exports.renderSignup = (req, res) => {
  res.render("users/signup.ejs");
};
//post signup
module.exports.signupUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);

      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};
// login routes
module.exports.renderLogin = (req, res) => {
  res.render("users/login.ejs");
};
module.exports.loginUser = async (req, res) => {
  req.flash("success", "Welcome back!");
  res.redirect(res.locals.redirectUrl || "/listings");
};
//logout route
module.exports.logoutUser = (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    res.redirect("/listings");
  });
};
