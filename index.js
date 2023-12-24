const password="Zz@7889514001"


import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: password,
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  // { id: 1, name: "Angela", color: "teal" },
  // { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1; ",
  [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
async function getUser()
{
  const result=await db.query("SELECT * FROM users");
  users=result.rows;
  return users.find(user=>user.id==currentUserId);
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
   const currentUser=await getUser();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser = await getUser();
  const countries = await checkVisisted();
 
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code , user_id) VALUES ($1,$2)",
        [countryCode,currentUser.id]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      
    }
  } catch (err) {
    console.log(err);
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: currentUser.color,
      error:" Country doesn't exist. Try another country!"
    });
  }
});
app.post("/user", async (req, res) => {
  if(req.body.add=="new")
  {
    res.render("new.ejs");
  }
  else{
    const user=req.body.user;
    currentUserId=user;
    res.redirect('/');}
 

});

app.post("/new", async (req, res) => {
  const name=req.body.name;
  const color=req.body.color;
  const data= await db.query("INSERT INTO users (name,color) VALUES ($1,$2) RETURNING *",[name,color]);
  currentUserId=data.rows[0].id;
  res.redirect('/');
 
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
