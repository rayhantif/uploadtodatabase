const express=require('express');
const bodyParser=require('body-parser');
const path=require('path');
const crypto=require('crypto');
const mongoose = require('mongoose');
const multer=require('multer');
const GridFsStorage=require('multer-gridfs-storage');
const Grid=require('gridfs-stream');
const methodOverride=require('method-override');



const app=express();
//Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

//MongoURI
const mongoURI='mongodb+srv://rayhan:rayhan@temuin-agty8.mongodb.net/test?retryWrites=true&w=majority';

//Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// init gfs
let gfs;

conn.once('open',()=>{
    gfs=Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

//create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload=multer({storage});

  //@route GET/
  //@desc Load form
  app.get('/',(req,res)=>{
    gfs.files.find().toArray((err, files)=>{
        // check files
        if(!files || files.length==0){
            res.render('index', {files: false});
        }
        else{
            files.map(file=>{
                if(file.contentType== 'image/jpeg'||file.contentType=='image/png'||file.contentType=='image/jpg'){
                    file.isImage=true;
                }
                else{
                    file.isImage=false;
                }
            });
            res.render('index', {files:files});
        }
        
    });
  });

  //@route Post /upload
  //@desc uploads file to DB
  app.post('/upload', upload.single('file'), (req,res)=>{
    //res.json({file: req.file});
    res.redirect('/');
  });

  //@route GET /files
  //@desc display all files in json
  app.get("/files", (req,res)=>{
    gfs.files.find().toArray((err, files)=>{
        // check files
        if(!files || files.length==0){
            return res.status(404).json({
                err:'no files'
            });
        }
        //files exist
        return res.json(files);
    });
  });

  //@route GET /files/:filename
  //@desc display  single file in json
  app.get("/files/:filename", (req,res)=>{
    gfs.files.findOne({filename: req.params.filename},(err,file)=>{
        //check file
        if(!file || file.length==0){
            return res.status(404).json({
                err:'no file'
            });
        }
        //file exist
        return res.json(file);
    });
  });

  //@route GET /image/:filename
  //@desc display image 
  app.get("/image/:filename", (req,res)=>{
    gfs.files.findOne({filename: req.params.filename},(err,file)=>{
        //check file
        if(!file || file.length==0){
            return res.status(404).json({
                err:'no file'
            });
        }
        //file image
        if(file.contentType=='image/jpeg'|| file.contentType=='image/png'){
            const readstream=gfs.createReadStream(file.filename);
            readstream.pipe(res);
        }
        else{
            res.status(404).json({
                err: 'Not an image'
            });
        }
    });
  });


const port = 5001;

app.listen(port,() => console.log(`Server started on port ${port}`));