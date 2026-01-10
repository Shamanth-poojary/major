const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
app.engine("ejs", ejsMate);
app.use(methodOverride("_method"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));
main()
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}
app.listen(8080, () => console.log("Server started on port 8080"));
app.get("/", (req, res) => res.send("root route"));
const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httponly: true,
  },
};
app.use(session(sessionOptions));
app.use(flash());
//passport config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//flash middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");

  next();
});
app.get("/fakeUser", (req, res) => {
  const user = new User({
    email: "student111@gmail.com",
    username: "student222",
  });
  let registeredUser = User.register(user, "helloworld");
  res.send(registeredUser);
});

//listing routes
const listingRoutes = require("./routes/listing");
app.use("/listings", listingRoutes);
//review routes
const reviewRoutes = require("./routes/review");
app.use("/listings/:id/reviews", reviewRoutes);
//user routes
const userRoutes = require("./routes/user");
app.use("/", userRoutes);
// invalid page error
app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

// custom error handler
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Some error occurred" } = err;
  res.status(statusCode).render("error.ejs", { statusCode, message, err });
});
