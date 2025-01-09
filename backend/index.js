import  express from "express";
const app= express();
const  port= 3000;
import  duckdb from "@duckdb/node-api";
import  cors from "cors";
import  {DuckDBInstance } from "@duckdb/node-api";
import OpenAI from 'openai';
import e from "express";
app.use(cors());
app.use(express.json());
const instance = await DuckDBInstance.create('my_duckdb.db');
let connection= await instance.connect();

app.get("/", (req, res) => {
    res.send("Hello World!");
})

app.post("/create_table",async (req,res)=>{
    const name_table=req.body?.name;
    try{
         await connection.run(`CREATE TABLE ${name_table} (
            country STRING,
            date STRING,
            total_cases INTEGER,
            new_cases INTEGER,
            total_deaths INTEGER,
            new_deaths INTEGER,
            vaccinations INTEGER
        )`)
        await connection.run(`INSERT INTO ${name_table} (country, date, total_cases, new_cases, total_deaths, new_deaths, vaccinations)
        VALUES
            ('India', '2025-01-01', 35000000, 100000, 450000, 1200, 90000000),
            ('India', '2025-01-02', 35150000, 150000, 451200, 1300, 91000000);
        `)
        res.json({message:"Table created successfully",name_table} );
    }catch(err){
        console.log(err.message,"error while creating table");
        res.json({messge:"Table not created",
            error:err.message}
        );
    }
})

app.post("/show_table", async (req,res)=>{
    const name_table=req.body?.name;
    try{

        const result= await connection.run(`SELECT * FROM ${name_table}`);

        res.json({message:"table fetched succefully"
                ,name_table
                ,data:result
            })
    }
    catch(err){
        console.log(err.message,"error while showing table");
        res.json("Table not found/enter correct table name");
    }  
})

app.post("/insert_data",async (req,res)=>{
    
    const {name_table,country,data,total_cases,new_cases,total_deaths,new_deaths,vaccinations}=req.body;
    try{
        const tableExists = await connection.run(
            `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
            [name_table]
        );

        if (!tableExists) {
            return res.json("Table not found/enter correct table name");
        }

       const result= await connection.run(
        `INSERT INTO ${name_table} (country, date, total_cases, new_cases, total_deaths, new_deaths, vaccinations) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`, 
        [country, data, total_cases, new_cases, total_deaths, new_deaths, vaccinations]
    );
  
        res.json({message:`Data inserted successfully ${table_name}`});
    }
    catch(err){
        console.log(err.message,"error while inserting data");
        res.json({message:"Data not inserted"
            ,error: err.message}
        );
    }
})

app.post("/delete_data",async (req,res)=>{
    const {country,table_name}=req?.body?.data;
    const table= await connection.run(`Find table ${table_name}`);
    if(!table){
        res.json("Table not found/enter correct table name");
    }

    try{
        await connection.run(`DELETE FROM ${table} WHERE country=?`,[country]);
        res.json(`Data deleted successfully from ${table_name}, ${country}`);
    }
    catch(error){
        console.log(error.message,"error while deleting data");
        res.json({message:"Data not deleted successfully",
            error:error.message}
        );
    }
})

app.put("/updata_data",async (req,res)=>{
    const {table_name,country,data,total_cases,new_cases,total_deaths,new_deaths,vaccinations}=req?.body?.data;
    const table= await connection.run(`Find table ${table_name}`);  
    if(!table){
        res.json("Table not found/enter correct table name");
    }

   try{
    await connection.run(`UPDATE covid_data SET country=?,date=?,total_cases=?,new_cases=?,total_deaths=?,new_deaths=?,vaccinations=? WHERE country=?`,[country,data,total_cases,new_cases,total_deaths,new_deaths,vaccinations,country]);
    res.json("Data updated successfully");
   }
    catch(error){
         console.log(error.message,"error while updating data");
         res.json({message:"Data not updated",
            error:error.message}
         ); // Add closing parenthesis
    }
})

// i dont know how to close the connection
function close(){
    connection.close();
}

const OPENAI_API_KEY="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"
const client = new OpenAI({
    apiKey:OPENAI_API_KEY, // This is the default and can be omitted
  });
//  console.log(apiKey);
// Convert natural language query to SQL query
async function textToSQL(query) {
    try{
        const params= {
            messages: [{ role: 'user', content:`convert this natural language to Sql command ${query}` }],
            model: 'gpt-4o',
        };
        const chatCompletion= await client.chat.completions.create(params);
        return chatCompletion;
    }catch(error){
        console.log(error.message,"error while converting text to sql");
        return error.message;
    }  
//    return "failed somewhere";
}
// Convert natural language query to SQL query
app.post("/convert-text-to-sql", async (req, res) => {
    const  query  = req.body?.query; // Get the natural language query from the request body
    try {
      const sqlQuery = await textToSQL(query); // Convert to SQL query
      res.status(200).json({ sqlQuery});
    } catch (error) {
      res.status(500).json({ message: "Failed to generate SQL query", details: error.message });
    }
  });
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
}
)