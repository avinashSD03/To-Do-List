import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import _ from 'lodash';

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "mytodolist",
  password: "your password",
  port: 5432,
});
db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

async function getListNames(){
    const queryRes=await db.query("SELECT DISTINCT task_type FROM list");
    let listName=[];
    queryRes.rows.forEach(element => {
      listName.push(element.task_type);
    });
    listName.sort();
    return listName;
}
app.get("/",(req, res) => {
  res.render("index.ejs");
});
// app.get("/", async(req, res) => {
//     let listName=await getListNames();
//     res.render("index.ejs",{
//       listNames:listName
//     });
// });
app.get("/:customListName",async(req,res)=>{
  const customName=_.capitalize(req.params.customListName);
  let is_del=false;
  const queryRes=await db.query("SELECT * FROM list WHERE task_type=$1 AND is_del=$2 ORDER BY priority",[customName,is_del]);
  is_del=true;
  const delName=await db.query("SELECT * FROM list WHERE task_type=$1 AND is_del=$2 ORDER BY priority",[customName,is_del]);
  let listName=await getListNames();
  if(queryRes.rows.length===0){
    res.render("lists.ejs",{
      listNames:listName,
      delNames:delName.rows,
      taskType:customName,
      compCount:delName.rows.length 
    });
  }
  else{
    res.render("lists.ejs",{
      taskList: queryRes.rows,
      listNames:listName,
      delNames:delName.rows,
      taskType:customName,
      leftCount:queryRes.rows.length, 
      compCount:delName.rows.length
    });
  }
});
app.post("/add",async(req,res)=>{
  const item = req.body.newTask;
  const prio = req.body.priority;
  const task_type=req.body.taskType;
  const result=await db.query("INSERT INTO list(task,task_type,priority) VALUES($1,$2,$3) RETURNING *",[item,task_type,prio]);
  res.redirect("/"+task_type);
});
app.post("/check-del",async(req,res)=>{
  const itemID=req.body.delItem;
  const task_type=req.body.taskType;
  const is_del=1;
  const result=await db.query("UPDATE list SET is_del=$1 WHERE id=$2",[is_del,itemID]);
  res.redirect("/"+task_type);
});
app.post("/delete",async(req,res)=>{
  const item=req.body.delItemId;
  const task_type=req.body.taskType;
  const result=await db.query("DELETE FROM list WHERE id=$1",[item]);
  res.redirect("/"+task_type);
});
app.post("/deleteList",async(req,res)=>{
  const task_type=req.body.taskType;
  const result=await db.query("DELETE FROM list WHERE task_type=$1",[task_type]);
  res.redirect("/");
});
app.post("/edit", async (req, res) => {
  const itemID=req.body.updatedItemId;
  const itemName=req.body.updatedItemTitle;
  const result=await db.query("UPDATE list SET task=$1 WHERE id=$2",[itemName,itemID]);
  const task_type=req.body.taskType;
  res.redirect("/"+task_type);
});
app.post("/editPrio", async (req, res) => {
  const prioId=req.body.prioId;
  const prioName=req.body.myselect;
  const result=await db.query("UPDATE list SET priority=$1 WHERE id=$2",[prioName,prioId]);
  const task_type=req.body.taskType;
  res.redirect("/"+task_type);
});
app.post("/newlist",(req,res)=>{
  const newTaskType = req.body.newlist;
  res.redirect("/"+newTaskType);
});
app.post("/restore",async(req,res)=>{
  const itemId=req.body.restoreItemId;
  const task_type=req.body.taskType;
  const is_del=0;
  const result=await db.query("UPDATE list SET is_del=$1 WHERE id=$2",[is_del,itemId]);
  res.redirect("/"+task_type);
});
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
