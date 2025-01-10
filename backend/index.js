import  express from "express";
const app= express();
const  port= 3000;
import  duckdb from "@duckdb/node-api";
import  cors from "cors";
import  {DuckDBInstance, DuckDBMaterializedResult } from "@duckdb/node-api";
import OpenAI from 'openai';
import { nativeEnum } from "zod";
// import e from "express";
app.use(cors());
app.use(express.json());
const instance = await DuckDBInstance.create('my_duckdb.db');
let connection= await instance.connect();

app.get("/", (req, res) => {
    res.send("Hello World!");
})
//working
app.post("/create_table",async (req,res)=>{
    const name_table=req.body?.name;
    try{
         await connection.run(`CREATE TABLE ${name_table} (
            country STRING,
            date STRING,
            total_cases INTEGER,
          
        )`)
        res.json({message:"Table created successfully",name_table} );
    }catch(err){
        console.log(err.message,"error while creating table");
        res.json({messge:"Table not created",
            error:err.message}
        );
    }
})

//this test api check wherther the data is being added after passing to the the "create_table" api
// app.post("/test__for_adding_data", (req, res) => {

//         const {name,country,data,total_cases} = req?.body;
//         try{

//             connection.run(
//                 `INSERT INTO ${name} VALUES (${
//                     country
//                     }, '${data}', '${total_cases}')`
//                 );
                
//                 res.json("Success added data");
//     }catch(err){
//         res.json({message:err.message})
//     }
//       }
//   );
//   //# above api worked



app.post("/show_table", async (req,res)=>{
    const name_table=req.body?.name;
    try{
      const result_table= await connection.run (
            `SELECT COUNT(*)
             FROM ${name_table}`,
          );

//       this results into  //{
//     "message": {
//         "result": {}
//     }
// }
          res.json({message:result_table})
    }
    catch(err){
        console.log(err.message,"error while showing table");
        res.json("Table not found/enter correct table name");
    }  
})


app.post("/insert_data",async (req,res)=>{
    
    const {name,country,data,total_cases}=req.body?.data;
    try{
       await connection.run(
            `INSERT INTO ${name} VALUES (${
                country
                }, '${data}','${total_cases}')`
            );
        res.json({message:`Data inserted successfully  to ${name}`});
    }
    catch(err){
        console.log(err.message,"error while inserting data");
        res.json({message:"Data not inserted"
            ,error: err.message}
        );
    }
})

//not worker   "message": "Data not deleted successfully",
    // "error": "table is not defined"\

app.post("/delete_data",async (req,res)=>{
    const {country,table_name}=req?.body?.data;
   
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
// "error": "Invalid Input Error: Expected 4 parameters, but none were supplied"
app.put("/update_data",async (req,res)=>{
    const {table_name,country,data,total_cases}=req.body;
   
   try{
    await connection.run(`UPDATE ${table_name} SET 
        ${country},${data},${total_cases}`);
    res.json("Data updated successfully");
   }
    catch(error){
         console.log(error.message,"error while updating data");
         res.json({message:"Data not updated",
            error:error.message}
         );
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
//# result = dont have  acces to the gpt models
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
}
)