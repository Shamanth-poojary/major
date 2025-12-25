const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
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
app.get("/listings", async (req, res) => {
  const alllistings = await Listing.find({});
  res.render("listings/index.ejs", { alllistings });
});

// Debug route: return connection info and recent listings
app.get('/api/listings', async (req, res) => {
  try {
    const recent = await Listing.find({}).sort({ _id: -1 }).limit(50);
    return res.json({
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.name,
      host: mongoose.connection.host,
      recent,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});
//new route
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

//show route
app.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
});
//post route
app.post("/listings", async (req, res) => {
  try {
    const newlisting = new Listing(req.body.listing);
    await newlisting.save();
    res.redirect("/listings");
  } catch (err) {
    next(err);
    // If validation error, re-render the form with submitted data and error messages
    if (err.name === "ValidationError") {
      // build a simple errors object mapping field -> message
      const errors = {};
      for (let field in err.errors) {
        // Use the original Mongoose message
        errors[field] = err.errors[field].message;
      }
      return res
        .status(400)
        .render("listings/new.ejs", { listing: req.body.listing, errors });
    }
    // otherwise rethrow
    throw err;
  }
});
//edit route
app.get("/listings/:id/edit", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});
//update route
app.put("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect("/listings");
});
//delete route
app.delete("/listings/:id", async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
});
//custom error handler
app.use((err, req, res, next) => {
  res.send("something went wrong");
});
